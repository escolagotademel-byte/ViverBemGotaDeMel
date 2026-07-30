#!/usr/bin/env python3
"""Atualiza data/receitas.json com publicações da seção Receitas Fáceis do TudoGostoso.

O script preserva o JSON existente quando a fonte está indisponível ou quando a
estrutura da página muda, evitando que o aplicativo fique sem conteúdo.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag

SOURCE_URL = "https://www.tudogostoso.com.br/noticias/cardapios/receitas-faceis"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "receitas.json"
MAX_ITEMS = 12
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
}


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def image_url(img: Tag | None) -> str:
    if not img:
        return ""
    candidates = [
        img.get("data-src"),
        img.get("data-lazy-src"),
        img.get("data-original"),
        img.get("src"),
    ]
    srcset = img.get("srcset") or img.get("data-srcset")
    if srcset:
        # Prefere a maior imagem anunciada no srcset.
        parts = [part.strip().split()[0] for part in srcset.split(",") if part.strip()]
        if parts:
            candidates.insert(0, parts[-1])
    for candidate in candidates:
        if candidate and not str(candidate).startswith("data:"):
            return urljoin(SOURCE_URL, str(candidate))
    return ""


def closest_container(heading: Tag) -> Tag:
    """Encontra o menor bloco que reúna título, imagem, resumo e link."""
    for parent in heading.parents:
        if not isinstance(parent, Tag):
            continue
        if parent.name in {"article", "li"}:
            return parent
        classes = " ".join(parent.get("class", []))
        if re.search(r"card|item|post|article|news|content", classes, re.I):
            if parent.find("img") and parent.find("a", href=True):
                return parent
        if parent.name in {"main", "body"}:
            break
    return heading.parent if isinstance(heading.parent, Tag) else heading


def find_article_link(heading: Tag, container: Tag) -> str:
    candidates: list[Tag] = []
    if heading.parent and isinstance(heading.parent, Tag) and heading.parent.name == "a":
        candidates.append(heading.parent)
    candidates.extend(container.find_all("a", href=True))
    for anchor in candidates:
        href = clean(anchor.get("href"))
        absolute = urljoin(SOURCE_URL, href)
        if (
            "tudogostoso.com.br" in absolute
            and "/noticias/" in absolute
            and "receitas-faceis" not in absolute.rstrip("/")
        ):
            return absolute
    return ""


def find_summary(heading: Tag, container: Tag) -> str:
    # Primeiro procura parágrafos após o título dentro do mesmo card.
    for paragraph in container.find_all("p"):
        text = clean(paragraph.get_text(" ", strip=True))
        if len(text) >= 35 and not text.lower().startswith(("em ", "publicado")):
            return text[:260]
    # Algumas versões da página usam div/span em vez de p.
    for node in container.find_all(["div", "span"]):
        text = clean(node.get_text(" ", strip=True))
        if 45 <= len(text) <= 300 and text != clean(heading.get_text(" ", strip=True)):
            if not text.lower().startswith(("em ", "publicado")):
                return text[:260]
    return "Leia a publicação completa no TudoGostoso."


def parse_items(html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "lxml")
    items: list[dict[str, str]] = []
    seen: set[str] = set()

    # Na página atual, as publicações da listagem usam h2. O filtro de link evita
    # títulos do cabeçalho e das áreas de navegação.
    for heading in soup.find_all(["h2", "h3"]):
        title = clean(heading.get_text(" ", strip=True))
        if len(title) < 20 or title.lower() == "receitas fáceis":
            continue
        container = closest_container(heading)
        link = find_article_link(heading, container)
        if not link or link in seen:
            continue
        img = container.find("img")
        image = image_url(img)
        if not image:
            # A imagem pode estar num link/irmão imediatamente anterior.
            previous = container.find_previous("img")
            image = image_url(previous)
        summary = find_summary(heading, container)
        items.append(
            {
                "titulo": title,
                "resumo": summary,
                "imagem": image,
                "url": link,
                "fonte": "TudoGostoso",
            }
        )
        seen.add(link)
        if len(items) >= MAX_ITEMS:
            break

    return items


def load_existing() -> dict[str, Any]:
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"fonte": "TudoGostoso", "origem": SOURCE_URL, "receitas": []}


def main() -> int:
    existing = load_existing()
    try:
        response = requests.get(SOURCE_URL, headers=HEADERS, timeout=35)
        response.raise_for_status()
        items = parse_items(response.text)
        if len(items) < 3:
            raise RuntimeError(f"Somente {len(items)} receitas válidas foram encontradas")
    except Exception as exc:  # O backup local deve continuar publicado.
        print(f"Aviso: não foi possível atualizar receitas: {exc}", file=sys.stderr)
        print("O arquivo data/receitas.json existente foi preservado.")
        return 0

    payload = {
        "fonte": "TudoGostoso",
        "origem": SOURCE_URL,
        "atualizado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "receitas": items,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(items)} receitas salvas em {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
