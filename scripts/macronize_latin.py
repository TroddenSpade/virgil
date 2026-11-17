#!/usr/bin/env python3
"""Editorial macronization helper for Latin Library texts.

The Latin Library prints no vowel quantities. For original editions on the
Advanced or Latīnistae shelves the Diacritics menu must still have something to
hide, so this helper supplies editorial macra with the Alatius Latin Macronizer.

It protects the reader's inline markup ({i}, {/i}, {b}, {/b}) from being
macronized and caches every request so reruns are cheap.

Usage from another script:

    from macronize_latin import macronize_text, macronize_blocks
    text = macronize_text(text, cache_path='/tmp/author-cache.json')
    paragraphs = macronize_blocks(paragraphs, cache_path='/tmp/author-cache.json')

Or from the command line:

    python3 scripts/macronize_latin.py < input.txt > output.txt
"""
from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = 'https://alatius.com/macronizer/'
DEFAULT_CACHE = Path('/tmp/virgil-macronizer-cache.json')

MARKUP = [
    ('{i}', '§§1§§'),
    ('{/i}', '§§2§§'),
    ('{b}', '§§3§§'),
    ('{/b}', '§§4§§'),
]

_cache: dict[str, str] = {}
_cache_path: Path | None = None


def _load_cache(cache_path: Path) -> dict[str, str]:
    global _cache, _cache_path
    if _cache_path == cache_path:
        return _cache
    _cache_path = cache_path
    if cache_path.exists():
        try:
            _cache = json.loads(cache_path.read_text(encoding='utf-8'))
        except Exception:
            _cache = {}
    else:
        _cache = {}
    return _cache


def _restore(value: str) -> str:
    for original, placeholder in MARKUP:
        value = value.replace(placeholder, original)
    return value


def macronize_text(text: str, cache_path: str | Path = DEFAULT_CACHE) -> str:
    """Return `text` with editorial macra, preserving all inline markup."""
    if not text or not re.search(r'[A-Za-z]', text):
        return text
    cache_path = Path(cache_path)
    cache = _load_cache(cache_path)
    if text in cache:
        return cache[text]

    protected = text
    for original, placeholder in MARKUP:
        protected = protected.replace(original, placeholder)

    data = urllib.parse.urlencode({'textcontent': protected, 'macronize': 'on'}).encode()
    request = urllib.request.Request(
        API,
        data=data,
        headers={'User-Agent': 'Virgil-content-audit/1.0'},
    )
    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                page = response.read().decode('utf-8', 'replace')
            match = re.search(
                r'<div class="prewrap" id="selectme"[^>]*>(.*?)</div>',
                page,
                re.S,
            )
            if not match:
                raise RuntimeError('macronizer returned no selectme div')
            result = _restore(html.unescape(re.sub(r'<[^>]+>', '', match.group(1))))
            cache[text] = result
            cache_path.write_text(
                json.dumps(cache, ensure_ascii=False),
                encoding='utf-8',
            )
            time.sleep(0.12)
            return result
        except Exception as error:  # noqa: BLE001 - retry network failures
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    print(f'macronizer failed; leaving text unchanged: {last_error}', file=sys.stderr)
    return text


def macronize_blocks(blocks: list[str], cache_path: str | Path = DEFAULT_CACHE) -> list[str]:
    """Macronize a list of paragraphs and preserve their boundaries."""
    if not blocks:
        return blocks
    joined = '\n\n'.join(blocks)
    result = macronize_text(joined, cache_path)
    parts = result.split('\n\n')
    if len(parts) == len(blocks):
        return parts
    return [macronize_text(block, cache_path) for block in blocks]


if __name__ == '__main__':
    source = sys.stdin.read()
    sys.stdout.write(macronize_text(source))
