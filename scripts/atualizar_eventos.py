"""Atualiza data/eventos.json com eventos reais publicados pela APPAI e pelo SESC Rio.

O coletor usa um navegador real (Playwright), pois a programação pode ser carregada
por JavaScript. As imagens exibidas no Viver Bem são ilustrações genéricas locais.
"""
from __future__ import annotations

import asyncio
import json
import re
import unicodedata
from dataclasses import dataclass, asdict
from datetime import date, datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

from dateutil import parser as date_parser
from playwright.async_api import async_playwright, Page

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "eventos.json"
CURRENT_YEAR = date.today().year
MAX_EVENTS_PER_SOURCE = 30

SOURCES = {
    "APPAI": "https://www.appai.org.br/lazer/eventos/",
    "SESC": "https://www.sescrio.org.br/programacao/",
}

DATE_RE = re.compile(r"\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b")
TIME_RE = re.compile(r"\b([01]?\d|2[0-3])(?::|h)([0-5]\d)?\b", re.I)

@dataclass
class Event:
    id: str
    titulo: str
    data: str
    dataFim: str | None
    horario: str
    local: str
    descricao: str
    fonte: str
    url: str
    categoria: str
    imagem: str


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" \n\t-|•")


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return value[:70] or "evento"


def parse_date(text: str) -> date | None:
    match = DATE_RE.search(text)
    if not match:
        # Algumas páginas usam datas por extenso.
        months = {
            "janeiro": 1, "fevereiro": 2, "marco": 3, "março": 3,
            "abril": 4, "maio": 5, "junho": 6, "julho": 7,
            "agosto": 8, "setembro": 9, "outubro": 10,
            "novembro": 11, "dezembro": 12,
        }
        m = re.search(r"\b(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{4}))?", text.lower())
        if not m or m.group(2) not in months:
            return None
        year = int(m.group(3) or CURRENT_YEAR)
        try:
            candidate = date(year, months[m.group(2)], int(m.group(1)))
        except ValueError:
            return None
    else:
        day, month = int(match.group(1)), int(match.group(2))
        year_raw = match.group(3)
        year = int(year_raw) if year_raw else CURRENT_YEAR
        if year < 100:
            year += 2000
        try:
            candidate = date(year, month, day)
        except ValueError:
            return None

    # Em dezembro, uma agenda de janeiro sem ano normalmente se refere ao ano seguinte.
    if candidate < date.today() and not re.search(r"\d{4}", text):
        if date.today().month == 12 and candidate.month <= 2:
            candidate = candidate.replace(year=CURRENT_YEAR + 1)
    return candidate


def category(text: str) -> str:
    value = text.lower()
    groups = [
        ("infantil", ("infantil", "criança", "kids", "família", "familia", "contação", "contacao")),
        ("musica", ("show", "música", "musica", "concerto", "samba", "jazz", "tributo", "musical")),
        ("exposicao", ("exposição", "exposicao", "mostra", "galeria", "artes visuais")),
        ("cinema", ("cinema", "filme", "cine")),
        ("danca", ("dança", "danca", "ballet", "balé")),
        ("comedia", ("comédia", "comedia", "stand up", "humor")),
        ("teatro", ("teatro", "peça", "peca", "espetáculo", "espetaculo")),
        ("esporte", ("esporte", "corrida", "caminhada", "torneio")),
    ]
    for key, words in groups:
        if any(word in value for word in words):
            return key
    return "cultura"


def image_for(cat: str) -> str:
    return f"assets/eventos/{cat if cat in {'infantil','musica','exposicao','cinema','danca','comedia','teatro','esporte'} else 'cultura'}.svg"


def extract_time(text: str) -> str:
    m = TIME_RE.search(text)
    if not m:
        return "Consulte no site oficial"
    minute = m.group(2) or "00"
    return f"{int(m.group(1)):02d}:{minute}"


def likely_location(lines: list[str], date_line_index: int) -> str:
    around = lines[max(0, date_line_index - 2):date_line_index + 4]
    keywords = ("teatro", "sesc", "centro cultural", "sala", "cidade das artes", "shopping", "unidade", "arena", "auditório", "auditorio")
    for line in around:
        low = line.lower()
        if any(k in low for k in keywords) and not DATE_RE.search(line):
            return clean(line)[:120]
    # APPAI costuma escrever “30/07 - Teatro ...”
    date_line = lines[date_line_index]
    if " - " in date_line:
        right = clean(date_line.split(" - ", 1)[1])
        if right:
            return right[:120]
    return "Consulte no site oficial"


async def expand_page(page: Page) -> None:
    # Tenta carregar cards que aparecem ao rolar ou ao clicar em “carregar mais”.
    for _ in range(8):
        await page.mouse.wheel(0, 1800)
        await page.wait_for_timeout(500)
        for label in ("Carregar mais", "Ver mais", "Mostrar mais", "Mais eventos"):
            button = page.get_by_text(label, exact=False)
            try:
                if await button.count() and await button.first.is_visible():
                    await button.first.click(timeout=1200)
                    await page.wait_for_timeout(900)
            except Exception:
                pass


async def collect_candidates(page: Page, source: str, base_url: str) -> list[tuple[str, str]]:
    """Retorna pares (texto do bloco, URL), usando cards/links e um fallback pelo corpo."""
    await page.goto(base_url, wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(3500)
    await expand_page(page)

    candidates: list[tuple[str, str]] = []
    anchors = page.locator("a[href]")
    count = min(await anchors.count(), 1500)
    allowed_host = urlparse(base_url).netloc.replace("www.", "")

    for i in range(count):
        anchor = anchors.nth(i)
        try:
            href = await anchor.get_attribute("href")
            if not href:
                continue
            url = urljoin(base_url, href)
            host = urlparse(url).netloc.replace("www.", "")
            if host and allowed_host not in host and source == "SESC":
                continue
            # Usa o card ancestral quando existir; senão, usa o próprio link.
            text = ""
            for selector in ("article", ".card", ".item", ".evento", ".event", "li", "a"):
                loc = anchor.locator(f"xpath=ancestor-or-self::{selector if selector == 'article' or selector == 'li' or selector == 'a' else '*'}[contains(concat(' ', normalize-space(@class), ' '), ' {selector.lstrip('.')} ')][1]") if selector.startswith('.') else anchor.locator(f"xpath=ancestor-or-self::{selector}[1]")
                if await loc.count():
                    text = clean(await loc.first.inner_text(timeout=1200))
                    if len(text) >= 20:
                        break
            if not text:
                text = clean(await anchor.inner_text(timeout=1200))
            if DATE_RE.search(text) and 15 <= len(text) <= 1000:
                candidates.append((text, url))
        except Exception:
            continue

    # Fallback importante para a APPAI: o título e a data podem não estar dentro do mesmo link.
    body_text = clean(await page.locator("body").inner_text())
    lines = [clean(x) for x in body_text.splitlines() if clean(x)]
    for idx, line in enumerate(lines):
        if DATE_RE.search(line):
            chunk = "\n".join(lines[max(0, idx - 1):idx + 2])
            candidates.append((chunk, base_url))

    return candidates


def candidates_to_events(candidates: Iterable[tuple[str, str]], source: str, base_url: str) -> list[Event]:
    events: list[Event] = []
    seen: set[tuple[str, str, str]] = set()
    today = date.today()

    for text, url in candidates:
        lines = [clean(x) for x in text.splitlines() if clean(x)]
        if not lines:
            continue
        date_idx = next((i for i, line in enumerate(lines) if DATE_RE.search(line) or parse_date(line)), -1)
        if date_idx < 0:
            continue
        event_date = parse_date(lines[date_idx]) or parse_date(text)
        if not event_date or event_date < today:
            continue

        title_candidates = [x for x in lines[:date_idx + 1] if not DATE_RE.search(x) and len(x) >= 3]
        title = clean(title_candidates[-1] if title_candidates else lines[0])
        title = re.sub(r"^(saiba mais|confira|ver detalhes)\s*", "", title, flags=re.I)
        if not title or len(title) > 180 or title.lower() in {"programação", "programacao", "eventos"}:
            continue

        location = likely_location(lines, date_idx)
        cat = category(text)
        key = (slug(title), event_date.isoformat(), source)
        if key in seen:
            continue
        seen.add(key)
        description = f"Evento publicado na programação oficial da {source}. Confirme disponibilidade, classificação, valores e regras no site oficial."
        events.append(Event(
            id=f"{source.lower()}-{event_date.isoformat()}-{slug(title)}",
            titulo=title,
            data=event_date.isoformat(),
            dataFim=None,
            horario=extract_time(text),
            local=location,
            descricao=description,
            fonte=source,
            url=url if url.startswith("http") else base_url,
            categoria=cat,
            imagem=image_for(cat),
        ))

    events.sort(key=lambda e: (e.data, e.titulo.lower()))
    return events[:MAX_EVENTS_PER_SOURCE]


async def main() -> None:
    all_events: list[Event] = []
    errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={"width": 1440, "height": 1200},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            locale="pt-BR",
        )
        for source, url in SOURCES.items():
            try:
                candidates = await collect_candidates(page, source, url)
                events = candidates_to_events(candidates, source, url)
                print(f"{source}: {len(candidates)} candidatos, {len(events)} eventos válidos")
                all_events.extend(events)
            except Exception as exc:
                errors.append(f"{source}: {exc}")
                print(f"Erro em {source}: {exc}")
        await browser.close()

    # Preserva a agenda anterior se os dois sites falharem no mesmo dia.
    if not all_events and OUTPUT.exists():
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
        previous["ultimaTentativa"] = datetime.now().astimezone().isoformat(timespec="seconds")
        previous["erros"] = errors or ["Nenhum evento futuro foi identificado."]
        OUTPUT.write_text(json.dumps(previous, ensure_ascii=False, indent=2), encoding="utf-8")
        return

    # Remove duplicados e ordena pelo evento mais próximo.
    unique: dict[tuple[str, str, str], Event] = {}
    for event in all_events:
        unique[(slug(event.titulo), event.data, event.fonte)] = event
    ordered = sorted(unique.values(), key=lambda e: (e.data, e.titulo.lower()))
    payload = {
        "atualizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "observacao": "Informações coletadas das páginas oficiais. Imagens meramente ilustrativas.",
        "erros": errors,
        "eventos": [asdict(event) for event in ordered],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
