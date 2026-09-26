"""Deterministic (regex) extraction and value normalisation.

Everything that has a fixed format is handled here so that the LLM is only used for
genuinely semantic work. Each hit keeps the *original* text (``raw``) as evidence and
a normalised ``value``.
"""
from __future__ import annotations

import re
from typing import Iterable, Optional

from schemas import RegexHit

# --------------------------------------------------------------------------- #
# Money
# --------------------------------------------------------------------------- #
_NUM = r"[0-9](?:[0-9,]*[0-9])?(?:\.\d+)?"
_SCALE = r"(?:\s*(lakhs?|lacs?|crores?|thousand)\b)?"
_MONEY_PREFIX = re.compile(rf"(?:₹|\bRs\.?|\bINR\b\.?|\bRupees\b)\s*({_NUM})(?:\s*/-)?{_SCALE}", re.I)
_MONEY_SUFFIX = re.compile(rf"(?<![\d,.])({_NUM})\s*(?:/-\s*)?{_SCALE}\s*(?:rupees|rs\b\.?|inr\b)", re.I)
_SCALES = {"thousand": 1_000, "lakh": 100_000, "lakhs": 100_000, "lac": 100_000,
           "lacs": 100_000, "crore": 10_000_000, "crores": 10_000_000}


def _fmt_number(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else f"{x:.2f}".rstrip("0").rstrip(".")


def _money_value(num: str, scale: Optional[str]) -> str:
    v = float(num.replace(",", ""))
    if scale:
        v *= _SCALES[scale.lower()]
    return _fmt_number(v)


def parse_amount(text: Optional[str]) -> Optional[float]:
    """'₹50,000' / 'Rs. 50,000/-' / 'INR 50000' / '2.5 lakh' / '50000' -> 50000.0"""
    if not text:
        return None
    for pat in (_MONEY_PREFIX, _MONEY_SUFFIX):
        m = pat.search(text)
        if m:
            return float(_money_value(m.group(1), m.group(2)))
    m = re.fullmatch(rf"\s*({_NUM})\s*(lakhs?|lacs?|crores?|thousand)?\s*", text, re.I)
    return float(_money_value(m.group(1), m.group(2))) if m else None


def amounts_in_text(text: str) -> set[float]:
    """All monetary amounts in ``text`` - used to verify LLM-reported amounts."""
    vals = {float(h.value) for h in extract_hits(text) if h.kind == "MONEY" and h.value}
    # bare comma-formatted numbers ("transferred 50,000 to ...")
    for m in re.finditer(r"(?<![\d,.])(\d{1,3}(?:,\d{2,3})+)(?![\d,])", text):
        vals.add(float(m.group(1).replace(",", "")))
    return vals


# --------------------------------------------------------------------------- #
# Dates / times / durations
# --------------------------------------------------------------------------- #
_MON = (r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|"
        r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)")
_MONTH_NO = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
_DATE_NUM = re.compile(r"(?<![\d/.\-])(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})(?![\d])")
_DATE_DMY = re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?[\s\-]+(?:of\s+)?({_MON})\b\.?(?:,?\s*(\d{{4}})\b)?", re.I)
_DATE_MDY = re.compile(rf"\b({_MON})\b\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?\b(?:,?\s*(\d{{4}})\b)?", re.I)


def _iso(y: Optional[int], m: int, d: int) -> Optional[str]:
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return None
    return f"{y:04d}-{m:02d}-{d:02d}" if y else f"--{m:02d}-{d:02d}"


def _month(tok: str) -> Optional[int]:
    if tok.islower() and tok in ("may", "mar", "march"):   # avoid the verbs "may"/"march"
        return None
    return _MONTH_NO.get(tok[:3].lower())


def _date_hits(text: str) -> list[RegexHit]:
    hits: list[RegexHit] = []
    for m in _DATE_NUM.finditer(text):
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y = y + 2000 if y < 100 else y
        v = _iso(y, mo, d)
        if v:
            hits.append(RegexHit(kind="DATE", raw=m.group(0), value=v, start=m.start(), end=m.end()))
    for m in _DATE_DMY.finditer(text):
        mo = _month(m.group(2))
        v = _iso(int(m.group(3)) if m.group(3) else None, mo, int(m.group(1))) if mo else None
        if v:
            hits.append(RegexHit(kind="DATE", raw=m.group(0), value=v, start=m.start(), end=m.end()))
    for m in _DATE_MDY.finditer(text):
        mo = _month(m.group(1))
        v = _iso(int(m.group(3)) if m.group(3) else None, mo, int(m.group(2))) if mo else None
        if v:
            hits.append(RegexHit(kind="DATE", raw=m.group(0), value=v, start=m.start(), end=m.end()))
    return hits


_NB = r"(?<![\d:.,/\-])"
_AMPM = r"(a\.?\s?m\.?|p\.?\s?m\.?)"
_TIME_PATTERNS = [
    re.compile(rf"{_NB}(\d{{1,2}}):(\d{{2}})(?::\d{{2}})?\s*(?:{_AMPM}|(hrs\.?|hours))?(?![\d:])", re.I),
    re.compile(rf"{_NB}(\d{{1,2}})\.(\d{{2}})\s*(?:{_AMPM}|(hrs\.?|hours))(?![a-z])", re.I),
    re.compile(rf"{_NB}(\d{{1,2}})()\s*{_AMPM}(?![a-z])", re.I),
    re.compile(rf"{_NB}([01]?\d|2[0-3])([0-5]\d)\s*(hrs\.?|hours)(?![a-z])", re.I),
]


def _time_hits(text: str) -> list[RegexHit]:
    hits: list[RegexHit] = []
    for pat in _TIME_PATTERNS:
        for m in pat.finditer(text):
            h, mi = int(m.group(1)), int(m.group(2) or 0)
            groups = m.groups()[2:]
            ampm = next((g for g in groups if g and g[0].lower() in "ap" and "m" in g.lower()), None)
            if ampm:
                if not 1 <= h <= 12:
                    continue
                h = (h % 12) + (12 if ampm[0].lower() == "p" else 0)
            elif h > 23:
                continue
            if mi > 59:
                continue
            hits.append(RegexHit(kind="TIME", raw=m.group(0).strip(), value=f"{h:02d}:{mi:02d}",
                                 start=m.start(), end=m.start() + len(m.group(0).rstrip())))
    return hits


_DURATION = re.compile(r"(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b", re.I)


def parse_duration_seconds(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    total, found = 0.0, False
    for m in _DURATION.finditer(text):
        unit = m.group(2).lower()
        mult = 1 if unit.startswith("sec") else 60 if unit.startswith("min") else 3600
        total += float(m.group(1)) * mult
        found = True
    return int(total) if found else None


# --------------------------------------------------------------------------- #
# Identifiers
# --------------------------------------------------------------------------- #
_PHONE = re.compile(r"(?<![\w.])(?:\+?91[\s-]?|0)?([6-9]\d{4}[\s-]?\d{5})(?!\d)")
_ACCOUNT = re.compile(r"(?:a/c|acc(?:ount)?)\.?\s*(?:no\.?|number|num|#)?\s*[:\-–]?\s*(\d{9,18}|(?:[Xx*]+[\s-]?)+\d{3,6})(?!\d)", re.I)
_IFSC = re.compile(r"\b([A-Z]{4}0[A-Z0-9]{6})\b")
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
_PAN = re.compile(r"\b([A-Z]{5}\d{4}[A-Z])\b")
_AADHAAR = re.compile(r"(?<!\d)(\d{4}\s\d{4}\s\d{4})(?!\d)")
_VOTER = re.compile(r"\b([A-Z]{3}\d{7})\b")
_FIR_NO = re.compile(r"\bFIR\s*(?:No\.?|Number|#)?\s*[:\-]?\s*(\d{1,6}\s*/\s*\d{2,4})", re.I)
_CASE_NO = re.compile(r"\b(?:Crime|Case|Cr\.?)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Za-z0-9]+(?:\s*/\s*[A-Za-z0-9]+)*)", re.I)
_RTO_CODES = {"AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HP", "HR",
              "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "OR",
              "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"}
_VEHICLE = re.compile(r"\b([A-Z]{2})[\s-]?(\d{1,2})[\s-]?([A-Z]{1,3})[\s-]?(\d{4})\b")
_ADDRESS_HINT = re.compile(r"\bR/o\.?\s+(.+?)(?=[.;]\s|[.;]?$|,?\s+(?:aged|age|occupation|mobile|phone|contact|by caste)\b)", re.I)

_PRIORITY = ["FIR_NUMBER", "CASE_NUMBER", "EMAIL", "IFSC", "ACCOUNT", "PAN", "AADHAAR", "VOTER_ID",
             "VEHICLE_REG", "PHONE", "MONEY", "DATE", "TIME", "DURATION", "ADDRESS_HINT"]


def normalize_phone(text: Optional[str]) -> Optional[str]:
    """Any Indian mobile format -> 10 digits ('+91 98765-43210' -> '9876543210')."""
    if not text:
        return None
    d = re.sub(r"\D", "", text)
    if len(d) == 12 and d.startswith("91"):
        d = d[2:]
    elif len(d) == 11 and d.startswith("0"):
        d = d[1:]
    return d if re.fullmatch(r"[6-9]\d{9}", d) else None


def normalize_account(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    t = re.sub(r"[\s-]", "", text).upper()
    return t if re.fullmatch(r"\d{9,18}|[X*]+\d{3,6}", t) else None


def normalize_vehicle_reg(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    t = re.sub(r"[\s-]", "", text).upper()
    m = re.fullmatch(r"([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})", t)
    return t if m and m.group(1) in _RTO_CODES else None


def extract_hits(text: str) -> list[RegexHit]:
    """All regex hits in ``text`` with overlap resolution (higher-priority kinds win)."""
    cands: list[RegexHit] = []

    def add(kind: str, m: re.Match, value: Optional[str], grp: int = 0) -> None:
        if value is not None:
            cands.append(RegexHit(kind=kind, raw=m.group(grp), value=value,
                                  start=m.start(grp), end=m.end(grp)))

    for m in _FIR_NO.finditer(text):
        add("FIR_NUMBER", m, re.sub(r"\s+", "", m.group(1)), 1)
    for m in _CASE_NO.finditer(text):
        add("CASE_NUMBER", m, re.sub(r"\s+", "", m.group(1)), 1)
    for m in _EMAIL.finditer(text):
        add("EMAIL", m, m.group(0).lower())
    for m in _IFSC.finditer(text):
        add("IFSC", m, m.group(1), 1)
    for m in _ACCOUNT.finditer(text):
        add("ACCOUNT", m, normalize_account(m.group(1)), 1)
    for m in _PAN.finditer(text):
        add("PAN", m, m.group(1), 1)
    for m in _AADHAAR.finditer(text):
        add("AADHAAR", m, re.sub(r"\s", "", m.group(1)), 1)
    for m in _VOTER.finditer(text):
        add("VOTER_ID", m, m.group(1), 1)
    for m in _VEHICLE.finditer(text):
        add("VEHICLE_REG", m, normalize_vehicle_reg(m.group(0)))
    for m in _PHONE.finditer(text):
        add("PHONE", m, normalize_phone(m.group(0)))
    for pat in (_MONEY_PREFIX, _MONEY_SUFFIX):
        for m in pat.finditer(text):
            add("MONEY", m, _money_value(m.group(1), m.group(2)))
    cands += _date_hits(text) + _time_hits(text)
    for m in _DURATION.finditer(text):
        add("DURATION", m, str(parse_duration_seconds(m.group(0))))
    for m in _ADDRESS_HINT.finditer(text):
        add("ADDRESS_HINT", m, m.group(1).strip(" ,"), 1)

    accepted: list[RegexHit] = []
    for kind in _PRIORITY:
        for h in sorted((c for c in cands if c.kind == kind), key=lambda c: (c.start, -(c.end - c.start))):
            if kind != "ADDRESS_HINT" and any(h.start < a.end and a.start < h.end for a in accepted):
                continue
            if not any(a.kind == h.kind and a.start == h.start and a.end == h.end for a in accepted):
                accepted.append(h)
    return sorted(accepted, key=lambda h: h.start)


def hits_of(hits: Iterable[RegexHit], kind: str) -> list[RegexHit]:
    return [h for h in hits if h.kind == kind]
