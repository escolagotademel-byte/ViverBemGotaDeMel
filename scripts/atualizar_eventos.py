#!/usr/bin/env python3
"""Atualiza data/eventos.json com eventos futuros da APPAI e do SESC Rio.

O coletor procura primeiro dados estruturados (JSON-LD/Event) e depois usa
uma leitura visual dos cartões e links da página. Caso uma das fontes falhe,
os eventos futuros já existentes dessa fonte são preservados.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse

import dateparser
from bs4 import BeautifulSoup
from playwright.async_api import Browser, Page, TimeoutError as PlaywrightTimeoutError, async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "eventos.json"

SOURCES = {
    "APPAI": "https://www.appai.org.br/lazer/eventos/",
    "SESC": "https://www.sescrio.org.br/programacao/",
}

GENERIC_IMAGES = {
    "teatro": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80",
    "musica": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    "danca": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
    "cinema": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    "exposicao": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=80",
    "infantil": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
    "oficina": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
    "literatura": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
    "esporte": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    "cultura": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
}

MONTHS_PT = (
    "janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|"
    "setembro|outubro|novembro|dezembro"
)
DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?\b"),
    re.compile(rf"\b(\d{{1,2}})\s+de\s+({MONTHS_PT})(?:\s+de\s+(\d{{4}}))?\b", re.I),
]
TIME_PATTERN = re.compile(r"\b([01]?\d|2[0-3])[:h]([0-5]\d)?\b", re.I)


@dataclass
class Event:
    id: str
    titulo: str
    data: str
    horario: str
    local: str
    descricao: str
    fonte: str
    link: str
    imagem: str
    categoria: str
    imagemIlustrativa: bool = True

    def compatible_dict(self) -> dict[str, Any]:
        data = asdict(self)
        # Aliases para manter compatibilidade com diferentes versões do front-end.
        data.update(
            {
                "title": self.titulo,
                "date": self.data,
                "time": self.horario,
                "location": self.local,
                "description": self.descricao,
                "source": self.fonte,
                "url": self.link,
                "image": self.imagem,
                "category": self.categoria,
            }
        )
        return data


def clean_text(value: Any, limit: int = 600) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        value = " ".join(str(v) for v in value if v)
    text = BeautifulSoup(str(value), "html.parser").get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def category_for(text: str) -> str:
    n = normalize(text)
    mapping = [
        ("teatro", ("teatro", "espetaculo", "peça", "peca", "circo")),
        ("musica", ("show", "musica", "musical", "concerto", "samba", "jazz", "mpb")),
        ("danca", ("danca", "dança", "ballet", "balé")),
        ("cinema", ("cinema", "filme", "sessao", "sessão")),
        ("exposicao", ("exposicao", "exposição", "mostra", "galeria", "museu")),
        ("infantil", ("infantil", "crianca", "criança", "familia", "família")),
        ("oficina", ("oficina", "workshop", "vivencia", "vivência")),
        ("literatura", ("livro", "leitura", "literatura", "poesia")),
        ("esporte", ("esporte", "corrida", "futebol", "volei", "vôlei", "atividade fisica")),
    ]
    for category, words in mapping:
        if any(normalize(word) in n for word in words):
            return category
    return "cultura"


def parse_date(value: str) -> date | None:
    value = clean_text(value, 250)
    if not value:
        return None

    settings = {
        "DATE_ORDER": "DMY",
        "PREFER_DATES_FROM": "future",
        "RELATIVE_BASE": datetime.now(),
        "RETURN_AS_TIMEZONE_AWARE": False,
        "PARSERS": ["absolute-time", "relative-time", "custom-formats"],
    }
    parsed = dateparser.parse(value, languages=["pt"], settings=settings)
    if parsed:
        candidate = parsed.date()
        # Quando o site omite o ano e o parser escolhe o passado, use o próximo ano.
        if candidate < date.today() - timedelta(days=2) and not re.search(r"\b20\d{2}\b", value):
            try:
                candidate = candidate.replace(year=candidate.year + 1)
            except ValueError:
                pass
        return candidate

    return None


def extract_date_from_text(text: str) -> date | None:
    for pattern in DATE_PATTERNS:
        for match in pattern.finditer(text):
            parsed = parse_date(match.group(0))
            if parsed:
                return parsed
    return None


def extract_time(text: str) -> str:
    match = TIME_PATTERN.search(text or "")
    if not match:
        return ""
    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    return f"{hour:02d}:{minute:02d}"


def location_from_json(value: Any) -> str:
    if isinstance(value, str):
        return clean_text(value, 180)
    if isinstance(value, dict):
        name = clean_text(value.get("name"), 120)
        address = value.get("address")
        if isinstance(address, dict):
            address_text = ", ".join(
                clean_text(address.get(k), 80)
                for k in ("streetAddress", "addressLocality", "addressRegion")
                if address.get(k)
            )
        else:
            address_text = clean_text(address, 160)
        return " — ".join(part for part in (name, address_text) if part)
    return ""


def make_event(
    *,
    title: str,
    raw_date: str,
    source: str,
    link: str,
    description: str = "",
    location: str = "",
    raw_time: str = "",
) -> Event | None:
    title = clean_text(title, 180)
    if len(title) < 3:
        return None

    event_date = parse_date(raw_date) or extract_date_from_text(" ".join([raw_date, description, title]))
    if event_date is None or event_date < date.today():
        return None
    if event_date > date.today() + timedelta(days=370):
        return None

    link = urljoin(SOURCES[source], link or SOURCES[source])
    category = category_for(" ".join([title, description]))
    digest = hashlib.sha1(f"{source}|{normalize(title)}|{event_date.isoformat()}".encode()).hexdigest()[:12]
    time = extract_time(raw_time) or extract_time(raw_date) or extract_time(description)

    description = clean_text(description, 500)
    if not description:
        description = f"Programação publicada por {source}. Consulte os detalhes e condições no site oficial."

    return Event(
        id=f"{normalize(source)}-{digest}",
        titulo=title,
        data=event_date.isoformat(),
        horario=time,
        local=clean_text(location, 180),
        descricao=description,
        fonte=source,
        link=link,
        imagem=GENERIC_IMAGES[category],
        categoria=category,
    )


def walk_json(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)



def events_from_appai_text(html: str) -> list[Event]:
    """Extrai a programação da APPAI a partir do texto visível da página.

    A página da APPAI lista os eventos em pares de linhas: título e
    ``DD/MM - Local``. Esse formato é mais estável que depender de classes
    CSS específicas, que mudam com frequência no construtor visual do site.
    """
    soup = BeautifulSoup(html, "lxml")

    # Remove elementos que poluem o texto visível.
    for node in soup.select("script, style, noscript, svg, nav, footer"):
        node.decompose()

    lines = [clean_text(line, 260) for line in soup.get_text("\n").splitlines()]
    lines = [line for line in lines if line]

    date_line = re.compile(
        r"^(?P<day>\d{1,2})/(?P<month>\d{1,2})(?:/(?P<year>\d{2,4}))?\s*[-–—]\s*(?P<place>.+)$"
    )
    blocked = {
        "confira a programação", "eventos", "aconteceu", "saiba mais",
        "consulte disponibilidade", "clique e faça sua pré-inscrição",
    }

    results: list[Event] = []
    for idx, line in enumerate(lines):
        match = date_line.match(line)
        if not match or idx == 0:
            continue

        title = lines[idx - 1].strip(" -–—")
        if normalize(title) in {normalize(x) for x in blocked}:
            continue
        if len(title) < 3 or len(title) > 180:
            continue

        day = int(match.group("day"))
        month = int(match.group("month"))
        raw_year = match.group("year")
        year = int(raw_year) if raw_year else date.today().year
        if year < 100:
            year += 2000

        try:
            candidate = date(year, month, day)
        except ValueError:
            continue

        # A APPAI normalmente omite o ano. Em dezembro/janeiro, ajuste para
        # o próximo ano quando necessário.
        if not raw_year and candidate < date.today():
            try:
                candidate = candidate.replace(year=year + 1)
            except ValueError:
                continue

        if candidate < date.today() or candidate > date.today() + timedelta(days=370):
            continue

        place = clean_text(match.group("place"), 180)
        event = make_event(
            title=title,
            raw_date=candidate.isoformat(),
            raw_time=line,
            source="APPAI",
            link=SOURCES["APPAI"],
            description=f"{title}. Programação divulgada pela APPAI. Consulte disponibilidade, horários e regras no site oficial.",
            location=place,
        )
        if event:
            results.append(event)

    return deduplicate(results)

def events_from_jsonld(html: str, source: str) -> list[Event]:
    soup = BeautifulSoup(html, "lxml")
    results: list[Event] = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            payload = json.loads(script.string or script.get_text())
        except (json.JSONDecodeError, TypeError):
            continue
        for item in walk_json(payload):
            item_type = item.get("@type", "")
            types = item_type if isinstance(item_type, list) else [item_type]
            if not any("event" in str(t).lower() for t in types):
                continue
            event = make_event(
                title=item.get("name", ""),
                raw_date=str(item.get("startDate", "")),
                raw_time=str(item.get("startDate", "")),
                source=source,
                link=item.get("url", SOURCES[source]),
                description=item.get("description", ""),
                location=location_from_json(item.get("location")),
            )
            if event:
                results.append(event)
    return results


async def expand_page(page: Page, source: str) -> None:
    await page.wait_for_timeout(2500)
    for _ in range(7):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(900)
        buttons = page.get_by_text(re.compile(r"carregar mais|ver mais|mais eventos", re.I))
        try:
            if await buttons.count() > 0 and await buttons.first.is_visible():
                await buttons.first.click(timeout=2500)
                await page.wait_for_timeout(1200)
            else:
                break
        except Exception:
            break
    await page.evaluate("window.scrollTo(0, 0)")


async def events_from_dom(page: Page, source: str) -> list[Event]:
    base = SOURCES[source]
    records = await page.locator("a[href]").evaluate_all(
        """
        (anchors) => anchors.map(a => {
          const box = a.closest('article, li, .card, [class*="card"], [class*="event"], [class*="program"], .elementor-widget') || a.parentElement;
          const text = (box?.innerText || a.innerText || '').replace(/\\s+/g, ' ').trim();
          const titleNode = box?.querySelector('h1,h2,h3,h4,h5,strong,.title,[class*="title"]');
          return {
            href: a.href,
            anchor: (a.innerText || a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim(),
            title: (titleNode?.innerText || '').replace(/\\s+/g, ' ').trim(),
            text,
          };
        })
        """
    )

    events: list[Event] = []
    blocked_titles = {
        "saiba mais", "ver mais", "leia mais", "programacao", "programação", "inicio", "início",
        "instagram", "facebook", "youtube", "fale com a gente", "buscar", "limpar busca",
    }
    for record in records:
        href = record.get("href", "")
        text = clean_text(record.get("text", ""), 900)
        title = clean_text(record.get("title") or record.get("anchor"), 180)
        if not href or not text or normalize(title) in {normalize(x) for x in blocked_titles}:
            continue
        if len(text) < 20 or len(title) < 3:
            continue
        if urlparse(href).netloc and urlparse(href).netloc not in urlparse(base).netloc:
            continue
        event_date = extract_date_from_text(text)
        if not event_date:
            continue
        event = make_event(
            title=title,
            raw_date=event_date.isoformat(),
            raw_time=text,
            source=source,
            link=href,
            description=text,
            location="",
        )
        if event:
            events.append(event)
    return events


async def collect_source(browser: Browser, source: str, url: str) -> list[Event]:
    page = await browser.new_page(
        viewport={"width": 1440, "height": 1100},
        locale="pt-BR",
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
        ),
    )
    try:
        print(f"Consultando {source}: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        try:
            await page.wait_for_load_state("networkidle", timeout=15_000)
        except PlaywrightTimeoutError:
            pass
        await expand_page(page, source)
        html = await page.content()
        events = events_from_jsonld(html, source)
        if source == "APPAI":
            events.extend(events_from_appai_text(html))
        events.extend(await events_from_dom(page, source))
        print(f"{source}: {len(events)} registros candidatos")
        return deduplicate(events)
    finally:
        await page.close()


def deduplicate(events: Iterable[Event]) -> list[Event]:
    unique: dict[tuple[str, str, str], Event] = {}
    for event in events:
        key = (event.fonte, normalize(event.titulo), event.data)
        current = unique.get(key)
        if current is None or len(event.descricao) > len(current.descricao):
            unique[key] = event
    return list(unique.values())


def load_existing() -> list[Event]:
    if not OUTPUT.exists():
        return []
    try:
        payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
        items = payload.get("eventos", payload) if isinstance(payload, dict) else payload
        results = []
        for item in items:
            event_date = parse_date(str(item.get("data") or item.get("date") or ""))
            if not event_date or event_date < date.today():
                continue
            source = clean_text(item.get("fonte") or item.get("source"), 20).upper()
            if source not in SOURCES:
                continue
            event = make_event(
                title=item.get("titulo") or item.get("title") or "",
                raw_date=event_date.isoformat(),
                raw_time=item.get("horario") or item.get("time") or "",
                source=source,
                link=item.get("link") or item.get("url") or SOURCES[source],
                description=item.get("descricao") or item.get("description") or "",
                location=item.get("local") or item.get("location") or "",
            )
            if event:
                results.append(event)
        return results
    except Exception as exc:
        print(f"Aviso: não foi possível ler a agenda existente: {exc}", file=sys.stderr)
        return []


async def main() -> int:
    existing = load_existing()
    collected: dict[str, list[Event]] = {}
    failures: list[str] = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            for source, url in SOURCES.items():
                try:
                    collected[source] = await collect_source(browser, source, url)
                    if not collected[source]:
                        raise RuntimeError("nenhum evento futuro identificado")
                except Exception as exc:
                    failures.append(source)
                    collected[source] = []
                    print(f"Falha em {source}: {exc}", file=sys.stderr)
        finally:
            await browser.close()

    final_events: list[Event] = []
    for source in SOURCES:
        source_events = collected[source]
        if source_events:
            final_events.extend(source_events)
        else:
            preserved = [event for event in existing if event.fonte == source]
            final_events.extend(preserved)
            if preserved:
                print(f"{source}: preservados {len(preserved)} eventos da execução anterior")

    final_events = deduplicate(final_events)
    final_events.sort(key=lambda event: (event.data, event.horario or "23:59", event.titulo.lower()))
    final_events = final_events[:80]

    if not final_events and failures:
        print("Nenhuma fonte pôde ser atualizada e não há agenda anterior para preservar.", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "atualizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "fontes": list(SOURCES),
        "imagemAviso": "As imagens são meramente ilustrativas. Confirme os dados no site oficial.",
        "eventos": [event.compatible_dict() for event in final_events],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Agenda salva em {OUTPUT.relative_to(ROOT)} com {len(final_events)} eventos.")
    if failures:
        print("Fontes preservadas por falha: " + ", ".join(failures))
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
