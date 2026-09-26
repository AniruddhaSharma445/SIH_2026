"""FIR loading: PDF (PyMuPDF) or TXT -> Document with pages, paragraphs, sentences.

Also holds the text-cleaning / segmentation / name-normalisation helpers used
throughout the pipeline. Cleaning only normalises whitespace/unicode - it never
rewrites words - so evidence quoted from the cleaned text is the FIR's own
wording. Page numbers are preserved (1-based).
"""
from __future__ import annotations

import logging
import re
import unicodedata
from pathlib import Path
from typing import Optional

from schemas import Document, Page, Sentence

log = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Text cleaning / segmentation
# --------------------------------------------------------------------------- #
HONORIFICS = {"mr", "mrs", "ms", "miss", "shri", "shree", "sri", "smt", "shrimati",
              "kumari", "km", "dr", "adv", "prof", "sh", "master", "late", "er"}
NAME_SUFFIXES = {"bhai", "bhaiya", "ji", "sahab", "saheb", "sahib", "bhau", "sir", "madam"}

_ZERO_WIDTH = dict.fromkeys(map(ord, "\u200b\u200c\u200d\ufeff"), None)


def clean_text(raw: str) -> str:
    t = unicodedata.normalize("NFC", raw).translate(_ZERO_WIDTH)
    t = t.replace("\u00a0", " ").replace("\r\n", "\n").replace("\r", "\n")
    t = "\n".join(re.sub(r"[ \t]+", " ", ln).strip() for ln in t.split("\n"))
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


# A new logical line starts at "Label: value", "1. item", "- bullet".
_FIELD_LINE = re.compile(r"^(?:[A-Za-z][A-Za-z /().'-]{1,40}:\s*\S|\d{1,2}[.)]\s+\S|[-•*]\s+\S)")


def split_paragraphs(text: str) -> list[str]:
    paras: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        cur: list[str] = []
        for line in block.split("\n"):
            if not line.strip():
                continue
            if cur and _FIELD_LINE.match(line):
                paras.append(" ".join(cur))
                cur = []
            cur.append(line.strip())
        if cur:
            paras.append(" ".join(cur))
    return paras


_ABBREV = {"mr", "mrs", "ms", "dr", "smt", "shri", "sri", "sh", "no", "nos", "rs", "inr",
           "st", "ps", "p.s", "vs", "dt", "sec", "addl", "insp", "si", "asi", "hc", "pc",
           "ph", "mob", "dist", "tq", "approx", "ref", "ltd", "pvt", "s/o", "d/o", "w/o",
           "r/o", "c/o", "u/s", "viz", "e.g", "i.e", "vill", "opp", "nr", "govt", "co",
           "prof", "adv", "cr", "w.r.t", "a.k.a", "alias"}
_BOUNDARY = re.compile(r"(?<=[.!?।])\s+(?=[\"“(\[]?[A-Z0-9₹])")


def split_sentences(par: str) -> list[str]:
    out, start = [], 0
    for m in _BOUNDARY.finditer(par):
        prev = par[start:m.start()]
        m_last = re.search(r"(\S+)$", prev)
        last = m_last.group(1).rstrip(".").lower() if m_last else ""
        if last in _ABBREV or re.fullmatch(r"[a-z]", last):     # abbreviation / initial
            continue
        out.append(par[start:m.start()].strip())
        start = m.end()
    tail = par[start:].strip()
    if tail:
        out.append(tail)
    return [s for s in out if s]


# ----------------------------- names ------------------------------------- #
def normalize_person_name(raw: str) -> str:
    """Strip honorifics ("Mr.", "Shri") and address suffixes ("Bhai", "ji")."""
    s = re.sub(r"[\"“”()\[\]]", " ", raw)
    tokens = [t.strip(",;:") for t in s.split() if t.strip(",;:")]
    while tokens and tokens[0].strip(".").lower() in HONORIFICS:
        tokens.pop(0)
    while tokens and tokens[-1].strip(".").lower() in NAME_SUFFIXES:
        tokens.pop()
    name = " ".join(tokens)
    if name and (name.isupper() or name.islower()):
        name = name.title()
    return name


_TOKEN = re.compile(r"[^\s.,;:!?\"'()\[\]{}/\\\-–—]+")


def tokenize(s: str) -> list[str]:
    return _TOKEN.findall(s.casefold())


def name_key(name: str) -> str:
    """Comparison key: lower-case tokens without honorifics/suffixes/punctuation."""
    return " ".join(tokenize(normalize_person_name(name)))


# --------------------------------------------------------------------------- #
# Document loading
# --------------------------------------------------------------------------- #
def _read_text_file(path: Path) -> str:
    data = path.read_bytes()
    for enc in ("utf-8-sig", "utf-16", "cp1252", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _read_pdf(path: Path, warnings: list[str]) -> list[str]:
    import fitz  # PyMuPDF

    pages: list[str] = []
    with fitz.open(path) as pdf:
        if pdf.needs_pass:
            raise ValueError(f"{path.name} is password protected")
        for i, page in enumerate(pdf, start=1):
            blocks = page.get_text("blocks", sort=True)          # reading order
            text = "\n\n".join(b[4].strip() for b in blocks if b[6] == 0 and b[4].strip())
            if not text.strip():
                warnings.append(f"page {i}: no text layer (scanned image?) - OCR is needed for this page")
            pages.append(text)
    return pages


def load_document(path: str | Path, doc_id: Optional[str] = None) -> Document:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(path)
    warnings: list[str] = []
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        raw_pages = _read_pdf(path, warnings)
    elif suffix in (".txt", ".text", ".md"):
        raw_pages = _read_text_file(path).split("\f") or [""]
    else:
        raise ValueError(f"Unsupported file type {suffix!r}; use .pdf or .txt")
    pages = [Page(page_number=i, raw_text=t, clean_text=clean_text(t))
             for i, t in enumerate(raw_pages, start=1)]
    doc = Document(doc_id=doc_id or path.stem, source_file=path.name, pages=pages, warnings=warnings)
    segment_document(doc)
    if not any(p.clean_text for p in doc.pages):
        warnings.append("document contains no extractable text")
    return doc


def segment_document(doc: Document) -> None:
    """Fill ``page.sentences`` (page -> paragraph -> sentence)."""
    for page in doc.pages:
        page.sentences = []
        n = 0
        for p_idx, para in enumerate(split_paragraphs(page.clean_text)):
            for sent in split_sentences(para):
                n += 1
                page.sentences.append(Sentence(sentence_id=f"S{page.page_number}-{n:03d}",
                                               page_number=page.page_number,
                                               paragraph_index=p_idx, text=sent))
