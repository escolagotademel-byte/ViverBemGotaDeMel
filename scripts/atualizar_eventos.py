#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "eventos.json"

SOURCES = {
    "APPAI": "https://www.appai.org.br/lazer/eventos/",
    "SESC": "https://cultura.sescrio.org.br/programacao",
}

LOCAL_IMAGES = {
    "teatro": "assets/eventos/teatro.svg",
    "musica": "assets/eventos/musica.svg",
    "danca": "assets/eventos/danca.svg",
    "cinema": "assets/eventos/cinema.svg",
    "exposicao": "assets/eventos/exposicao.svg",
    "infantil": "assets/eventos/infantil.svg",
    "esporte": "assets/eventos/esporte.svg",
    "cultura": "assets/eventos/cultura.svg",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
}

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

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d.update({
            "title": self.titulo, "date": self.data, "time": self.horario,
            "location": self.local, "description": self.descricao,
            "source": self.fonte, "url": self.link, "image": self.imagem,
            "category": self.categoria,
        })
        return d


def clean(value: Any, limit: int = 600) -> str:
    text = BeautifulSoup(str(value or ""), "html.parser").get_text(" ", strip=True)
    text = text.replace("\xa0", " ").replace("\u200b", " ")
    return re.sub(r"\s+", " ", text).strip()[:limit]


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(c for c in value if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def category(text: str) -> str:
    n = norm(text)
    rules = [
        ("teatro", ("teatro", "comedia", "stand up", "espetaculo", "peca")),
        ("musica", ("musica", "show", "concerto", "samba", "forro", "jazz")),
        ("danca", ("danca", "ballet", "bale")),
        ("cinema", ("cinema", "audiovisual", "filme")),
        ("exposicao", ("artes visuais", "exposicao", "mostra")),
        ("infantil", ("infantil", "crianca", "cinderela", "moana", "mickey", "porquinhos")),
        ("esporte", ("esporte", "corrida", "futebol", "volei")),
    ]
    for cat, words in rules:
        if any(w in n for w in words):
            return cat
    return "cultura"


def event(title: str, d: date, source: str, place: str, link: str, desc: str = "", time: str = "") -> Event:
    cat = category(f"{title} {desc}")
    key = hashlib.sha1(f"{source}|{norm(title)}|{d.isoformat()}|{norm(place)}".encode()).hexdigest()[:12]
    return Event(
        id=f"{source.lower()}-{key}", titulo=clean(title, 180), data=d.isoformat(), horario=time,
        local=clean(place, 180), descricao=clean(desc, 500) or f"Programação divulgada pelo {source}. Confirme os detalhes no site oficial.",
        fonte=source, link=link, imagem=LOCAL_IMAGES.get(cat, LOCAL_IMAGES["cultura"]), categoria=cat,
    )


def infer_year(day: int, month: int, explicit: int | None = None) -> date | None:
    year = explicit or date.today().year
    try:
        candidate = date(year, month, day)
    except ValueError:
        return None
    if explicit is None and candidate < date.today() - timedelta(days=1):
        try:
            candidate = date(year + 1, month, day)
        except ValueError:
            return None
    if candidate < date.today() or candidate > date.today() + timedelta(days=370):
        return None
    return candidate


def get_html(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()
    return response.text


def collect_appai() -> list[Event]:
    html = get_html(SOURCES["APPAI"])
    soup = BeautifulSoup(html, "lxml")
    for node in soup.select("script, style, noscript, svg"):
        node.decompose()

    raw = soup.get_text("\n")
    lines = [clean(x, 260) for x in raw.splitlines()]
    lines = [x for x in lines if x]

    # Procura qualquer linha contendo DD/MM - Local, mesmo que haja espaços invisíveis.
    date_re = re.compile(r"(?<!\d)(\d{1,2})\s*/\s*(\d{1,2})(?:\s*/\s*(\d{2,4}))?\s*[-–—]\s*(.+)", re.I)
    blocked = {"aconteceu", "saiba mais", "confira", "eventos", "datas no portal"}
    found: list[Event] = []

    for i, line in enumerate(lines):
        m = date_re.search(line)
        if not m:
            continue
        day, month = int(m.group(1)), int(m.group(2))
        yr = int(m.group(3)) if m.group(3) else None
        if yr is not None and yr < 100:
            yr += 2000
        d = infer_year(day, month, yr)
        if not d:
            continue

        # O título costuma estar na linha imediatamente anterior. Caso não esteja,
        # retrocede até quatro linhas, ignorando rótulos e botões.
        title = ""
        for back in range(1, 5):
            if i - back < 0:
                break
            candidate = clean(lines[i - back], 180)
            n = norm(candidate)
            if len(candidate) >= 3 and not any(b in n for b in blocked) and not date_re.search(candidate):
                title = candidate
                break
        if not title:
            continue

        place = clean(m.group(4), 180)
        found.append(event(
            title, d, "APPAI", place, SOURCES["APPAI"],
            f"{title}. Evento disponível pelo Benefício Bom Espetáculo da APPAI. Consulte disponibilidade e regras no portal oficial."
        ))

    return dedupe(found)


def collect_sesc() -> list[Event]:
    html = get_html(SOURCES["SESC"])
    soup = BeautifulSoup(html, "lxml")
    for node in soup.select("script, style, noscript, svg"):
        node.decompose()
    lines = [clean(x, 260) for x in soup.get_text("\n").splitlines()]
    lines = [x for x in lines if x]

    # Formato atual dos cartões: Título 29/07/2026 CATEGORIA ... Unidade
    date_re = re.compile(r"(?<!\d)(\d{1,2})/(\d{1,2})/(20\d{2})(?!\d)")
    category_words = {"TEATRO", "MÚSICA", "MUSICA", "AUDIOVISUAL", "ARTES VISUAIS", "DANÇA", "DANCA", "CIRCO", "LITERATURA", "SHOW"}
    found: list[Event] = []

    for i, line in enumerate(lines):
        m = date_re.search(line)
        if not m:
            continue
        d = infer_year(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if not d:
            continue

        before = clean(line[:m.start()], 180)
        after = clean(line[m.end():], 260)
        title = before
        if not title and i > 0:
            title = lines[i - 1]
        if len(title) < 3 or norm(title) in {"programacao", "data"}:
            continue

        # Tenta identificar unidade no texto após a data.
        place = ""
        unit_match = re.search(r"((?:Centro Cultural |Teatro )?Sesc[^|,;]*|Centro Cultural Sesc[^|,;]*|Itaipava)", after, re.I)
        if unit_match:
            place = clean(unit_match.group(1), 180)
        else:
            # Em muitos cartões, a unidade é a última expressão depois da classificação.
            chunks = [c.strip() for c in re.split(r"\b(?:LIVRE|GRÁTIS|GRATIS|\d{1,2}\s*ANOS|TEATRO|MÚSICA|MUSICA|AUDIOVISUAL|ARTES VISUAIS|DANÇA|DANCA|CIRCO|LITERATURA|SHOW)\b", after, flags=re.I) if c.strip()]
            if chunks:
                place = chunks[-1]

        # Localiza o link do card pelo texto do título.
        href = SOURCES["SESC"]
        anchor = soup.find("a", string=lambda s: s and norm(title) in norm(s))
        if anchor and anchor.get("href"):
            href = urljoin(SOURCES["SESC"], anchor["href"])

        found.append(event(
            title, d, "SESC", place, href,
            f"{title}. Programação cultural do Sesc RJ. Confirme horários, ingressos e possíveis alterações no site oficial."
        ))

    return dedupe(found)


def dedupe(items: Iterable[Event]) -> list[Event]:
    out: dict[tuple[str, str, str, str], Event] = {}
    for item in items:
        out[(item.fonte, norm(item.titulo), item.data, norm(item.local))] = item
    return list(out.values())


def load_existing() -> list[Event]:
    if not OUTPUT.exists():
        return []
    try:
        payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
        records = payload.get("eventos", []) if isinstance(payload, dict) else payload
        items = []
        for x in records:
            raw = x.get("data") or x.get("date")
            try:
                d = date.fromisoformat(raw)
            except Exception:
                continue
            if d < date.today():
                continue
            source = clean(x.get("fonte") or x.get("source"), 20).upper()
            if source not in SOURCES:
                continue
            items.append(event(
                x.get("titulo") or x.get("title") or "", d, source,
                x.get("local") or x.get("location") or "",
                x.get("link") or x.get("url") or SOURCES[source],
                x.get("descricao") or x.get("description") or "",
                x.get("horario") or x.get("time") or "",
            ))
        return items
    except Exception as exc:
        print(f"Aviso ao ler agenda anterior: {exc}", file=sys.stderr)
        return []


def main() -> int:
    existing = load_existing()
    collected: list[Event] = []
    successful_sources: set[str] = set()

    for source, collector in (("APPAI", collect_appai), ("SESC", collect_sesc)):
        try:
            items = collector()
            print(f"{source}: {len(items)} eventos futuros encontrados")
            if items:
                collected.extend(items)
                successful_sources.add(source)
            else:
                print(f"Aviso: {source} não retornou eventos; preservando dados anteriores.")
        except Exception as exc:
            print(f"Aviso: falha ao consultar {source}: {exc}", file=sys.stderr)

    # Preserva somente as fontes que não puderam ser atualizadas.
    for item in existing:
        if item.fonte not in successful_sources:
            collected.append(item)

    final = dedupe(collected)
    final.sort(key=lambda x: (x.data, x.horario or "23:59", x.titulo.lower()))
    final = final[:100]

    # Nunca apaga uma agenda válida por falha temporária dos sites.
    if not final:
        print("Nenhum evento disponível. O arquivo existente não será sobrescrito.", file=sys.stderr)
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "atualizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "fontes": list(SOURCES),
        "imagemAviso": "As imagens são ilustrativas. Confirme os dados no site oficial.",
        "eventos": [x.to_dict() for x in final],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Agenda salva com {len(final)} eventos em data/eventos.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
