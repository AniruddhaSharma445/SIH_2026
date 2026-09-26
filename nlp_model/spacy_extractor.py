"""spaCy layer: NER + EntityRuler with Indian-FIR patterns.

spaCy is used for *candidates* (PERSON/ORG/GPE/...). It is never trusted blindly:
candidates are normalised, filtered, and finally judged by the semantic (Gemini) layer.
"""
from __future__ import annotations

import logging
import re
from typing import Iterable

from schemas import Document, Sentence, SpacyEntity
from pdf_extractor import HONORIFICS, NAME_SUFFIXES, name_key, normalize_person_name

log = logging.getLogger(__name__)

KEEP_LABELS = {"PERSON", "ORG", "GPE", "LOC", "FAC", "DATE", "TIME", "MONEY", "NORP",
               "ROLE", "VEHICLE_TYPE", "VEHICLE_MAKE", "POLICE_STATION", "LEGAL_SECTION"}
ROLE_WORDS = ["complainant", "accused", "co-accused", "suspect", "victim", "witness",
              "informant", "informer", "eyewitness"]
VEHICLE_TYPE_WORDS = ["car", "bike", "motorcycle", "motorbike", "scooter", "scooty", "truck",
                      "bus", "auto", "autorickshaw", "tempo", "van", "suv", "jeep", "tractor"]
VEHICLE_MAKE_WORDS = ["maruti", "suzuki", "swift", "alto", "wagonr", "dzire", "baleno", "hyundai",
                      "i10", "i20", "creta", "verna", "honda", "city", "activa", "amaze", "tata",
                      "nexon", "harrier", "mahindra", "scorpio", "bolero", "thar", "xuv", "toyota",
                      "innova", "fortuner", "ford", "kia", "seltos", "bajaj", "pulsar", "hero",
                      "splendor", "passion", "tvs", "apache", "jupiter", "yamaha", "royal", "enfield",
                      "bullet", "ashok", "leyland", "eicher"]
NAME_BLOCKLIST = {"police", "station", "officer", "sir", "madam", "court", "fir", "ipc", "bns",
                  "india", "ps", "the", "complainant", "accused", "witness", "victim", "informant",
                  "suspect", "inspector", "constable", "sub", "thana", "state", "government",
                  "madhya", "pradesh", "bhopal", "hon'ble", "learned", "magistrate", "section"}

_NAME = r"[A-Z][a-zA-Z]+(?:\s+(?:[A-Z][a-zA-Z]+|[A-Z]\.)){0,3}"
_ROLE_RX = r"(?i:co-?accused|accused|suspects?|complainant|victim|witness|eyewitness|informant|informer)"
_HON_RX = r"(?:(?:Mr|Mrs|Ms|Shri|Smt|Sri|Dr|Sh)\.?\s+)?"
_ROLE_BEFORE = re.compile(rf"{_ROLE_RX}\s*[,:]?\s+{_HON_RX}({_NAME})")
_ROLE_AFTER = re.compile(rf"{_HON_RX}({_NAME}),?\s+(?:(?:the|who\s+is\s+the|is\s+the|being\s+the|as\s+the)\s+)?{_ROLE_RX}\b")


def _ruler_patterns() -> list[dict]:
    hon = sorted({h for h in HONORIFICS} | {h + "." for h in HONORIFICS})
    pats: list[dict] = [
        {"label": "PERSON", "pattern": [{"LOWER": {"IN": hon}}, {"IS_PUNCT": True, "OP": "?"},
                                        {"IS_TITLE": True, "IS_ALPHA": True},
                                        {"IS_TITLE": True, "IS_ALPHA": True, "OP": "?"},
                                        {"IS_TITLE": True, "IS_ALPHA": True, "OP": "?"}]},
        {"label": "PERSON", "pattern": [{"IS_TITLE": True, "IS_ALPHA": True},
                                        {"LOWER": {"IN": sorted(NAME_SUFFIXES - {"sir", "madam"})}}]},
        {"label": "POLICE_STATION", "pattern": [{"LOWER": {"IN": ["p.s.", "p.s", "ps", "thana"]}},
                                                {"IS_TITLE": True, "OP": "+"}]},
        {"label": "POLICE_STATION", "pattern": [{"LOWER": "police"}, {"LOWER": "station"}, {"IS_PUNCT": True, "OP": "?"},
                                                {"IS_TITLE": True, "OP": "+"}]},
        {"label": "POLICE_STATION", "pattern": [{"IS_TITLE": True, "OP": "+"}, {"LOWER": "police"},
                                                {"LOWER": "station"}]},
        {"label": "ROLE", "pattern": [{"LOWER": "co"}, {"ORTH": "-"}, {"LOWER": "accused"}]},
        {"label": "LEGAL_SECTION", "pattern": [{"LOWER": {"IN": ["section", "sec", "u/s"]}},
                                               {"LIKE_NUM": True}, {"LOWER": {"IN": ["ipc", "bns", "bnss"]}, "OP": "?"}]},
    ]
    pats += [{"label": "ROLE", "pattern": [{"LOWER": w}]} for w in ROLE_WORDS if "-" not in w]
    pats += [{"label": "VEHICLE_TYPE", "pattern": [{"LOWER": w}]} for w in VEHICLE_TYPE_WORDS]
    pats += [{"label": "VEHICLE_MAKE", "pattern": [{"LOWER": w}]} for w in VEHICLE_MAKE_WORDS]
    return pats


def _clean_person(raw: str) -> str | None:
    name = normalize_person_name(raw)
    toks = [t.lower().strip(".") for t in name.split()]
    if not name or not toks or toks[0] in NAME_BLOCKLIST or all(t in NAME_BLOCKLIST for t in toks):
        return None
    if not any(c.isalpha() for c in name) or name.islower():
        return None
    return name


class SpacyProcessor:
    def __init__(self, model: str = "en_core_web_sm") -> None:
        import spacy

        self.has_ner = True
        try:
            self.nlp = spacy.load(model, exclude=["parser", "lemmatizer"])
        except OSError:
            log.warning("spaCy model %r not installed (python -m spacy download %s); "
                        "falling back to rule/ruler-only entity detection", model, model)
            self.nlp = spacy.blank("en")
            self.has_ner = False
        if "ner" in self.nlp.pipe_names:
            self.nlp.add_pipe("entity_ruler", before="ner")
        else:
            self.nlp.add_pipe("entity_ruler")
        self.nlp.get_pipe("entity_ruler").add_patterns(_ruler_patterns())

    # ------------------------------------------------------------------ #
    def process_sentences(self, sentences: Iterable[Sentence]) -> None:
        sentences = list(sentences)
        for sent, doc in zip(sentences, self.nlp.pipe([s.text for s in sentences], batch_size=64)):
            ents: list[SpacyEntity] = []
            for e in doc.ents:
                if e.label_ not in KEEP_LABELS:
                    continue
                norm = _clean_person(e.text) if e.label_ == "PERSON" else None
                if e.label_ == "PERSON" and not norm:
                    continue
                custom = e.label_ in {"ROLE", "VEHICLE_TYPE", "VEHICLE_MAKE", "POLICE_STATION", "LEGAL_SECTION"}
                ents.append(SpacyEntity(label=e.label_, text=e.text, start=e.start_char, end=e.end_char,
                                        source="ruler" if custom else "spacy", normalized=norm))
            ps = [x for x in ents if x.label == "POLICE_STATION"]
            ents = [x for x in ents if not (x.label == "PERSON" and any(x.start < p.end and p.start < x.end for p in ps))]
            ents = self._add_role_context_persons(sent.text, ents)
            sent.entities = sorted(ents, key=lambda x: x.start)

    def process_document(self, doc: Document) -> None:
        self.process_sentences(doc.sentences)
        self._gazetteer_pass(doc.sentences)

    @staticmethod
    def _gazetteer_pass(sentences: list[Sentence]) -> None:
        """Small NER models miss repeat mentions. Any multi-token person name found *anywhere*
        in the FIR is also matched (exact string) in every other sentence."""
        names = {name_key(e.normalized): e.normalized for s in sentences for e in s.entities
                 if e.label == "PERSON" and e.normalized and len(e.normalized.split()) >= 2}
        for s in sentences:
            for nm in names.values():
                pat = r"(?<!\w)" + r"\s+".join(map(re.escape, nm.split())) + r"(?!\w)"
                for m in re.finditer(pat, s.text):
                    if any(x.label in ("PERSON", "POLICE_STATION") and x.start < m.end() and m.start() < x.end
                           for x in s.entities):
                        continue
                    s.entities.append(SpacyEntity(label="PERSON", text=m.group(0), start=m.start(), end=m.end(),
                                                  source="gazetteer", normalized=nm))
            s.entities.sort(key=lambda x: x.start)

    @staticmethod
    def _add_role_context_persons(text: str, ents: list[SpacyEntity]) -> list[SpacyEntity]:
        """"Rahul Sharma, the complainant" / "accused Amit Verma": FIR-specific person cue."""
        for rx in (_ROLE_BEFORE, _ROLE_AFTER):
            for m in rx.finditer(text):
                name = _clean_person(m.group(1))
                if not name:
                    continue
                s, e = m.start(1), m.end(1)
                if any(x.label == "PERSON" and x.start < e and s < x.end for x in ents):
                    continue
                ents.append(SpacyEntity(label="PERSON", text=m.group(1), start=s, end=e,
                                        source="rule", normalized=name))
        return ents


def person_candidates(sentence: Sentence) -> list[SpacyEntity]:
    return [e for e in sentence.entities if e.label == "PERSON" and e.normalized]
