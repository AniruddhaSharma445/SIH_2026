"""Pydantic models: document structure, LLM output contracts and CSV row schemas.

Design notes
------------
* LLM-facing models (``*Out``) are *lenient*: unknown keys are ignored, "null"-like
  strings become ``None``, confidences are coerced into [0, 1], unknown enum values
  are mapped to a safe value ("unknown") or dropped. Malformed items never crash the
  pipeline - they are dropped one by one (see ``gemini_extractor.parse_chunk_result``).
* Row models (``*Row``) define the exact column order of every CSV file.
"""
from __future__ import annotations

import re
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# --------------------------------------------------------------------------- #
# Controlled vocabularies (from the specification)
# --------------------------------------------------------------------------- #
RELATIONSHIP_TYPES = [
    "friend", "associate", "relative", "business_partner", "employee", "employer",
    "met", "called", "messaged", "financial_link", "transaction", "transported",
    "accompanied", "witness", "victim", "accused", "co_accused", "supplier",
    "customer", "unknown",
]
# Types where (A, B) == (B, A). All others are directed source -> target.
SYMMETRIC_TYPES = {
    "friend", "associate", "relative", "business_partner", "met", "accompanied",
    "co_accused", "unknown",
}
ROLES = ["suspect", "accused", "victim", "complainant", "witness", "informant",
         "associate", "unknown"]
# When a person has several roles they are all kept, most "serious" first.
ROLE_PRIORITY = ["accused", "suspect", "victim", "complainant", "informant",
                 "witness", "associate", "unknown"]
VEHICLE_TYPES = ["car", "suv", "motorcycle", "scooter", "truck", "bus", "van",
                 "auto_rickshaw", "tempo", "tractor", "bicycle", "other"]
COMM_TYPES = ["call", "sms", "whatsapp", "other"]

_NULL_STRINGS = {"", "null", "none", "n/a", "na", "nil", "not available",
                 "not mentioned", "not stated", "not provided", "unspecified", "-"}


def _snake(v: Any) -> Any:
    return re.sub(r"[\s\-/]+", "_", v.strip().lower()) if isinstance(v, str) else v


# --------------------------------------------------------------------------- #
# Document structure
# --------------------------------------------------------------------------- #
class SpacyEntity(BaseModel):
    label: str
    text: str
    start: int          # char offsets inside the sentence
    end: int
    source: str = "spacy"   # spacy | ruler | rule
    normalized: Optional[str] = None


class RegexHit(BaseModel):
    kind: str           # PHONE, MONEY, DATE, TIME, ACCOUNT, IFSC, VEHICLE_REG, ...
    raw: str            # original text (evidence)
    value: Optional[str] = None   # normalised value
    start: int
    end: int


class Sentence(BaseModel):
    sentence_id: str
    page_number: int
    paragraph_index: int
    text: str
    entities: list[SpacyEntity] = Field(default_factory=list)
    hits: list[RegexHit] = Field(default_factory=list)


class Page(BaseModel):
    page_number: int
    raw_text: str                       # exactly what the extractor returned
    clean_text: str = ""                # whitespace-normalised, content preserved
    sentences: list[Sentence] = Field(default_factory=list)


class Document(BaseModel):
    doc_id: str
    source_file: str
    pages: list[Page]
    warnings: list[str] = Field(default_factory=list)

    @property
    def sentences(self) -> list[Sentence]:
        return [s for p in self.pages for s in p.sentences]


class Chunk(BaseModel):
    chunk_id: str
    doc_id: str
    page_number: int
    sentences: list[Sentence]
    context_before: list[str] = Field(default_factory=list)
    context_after: list[str] = Field(default_factory=list)

    @property
    def text(self) -> str:
        return "\n".join(s.text for s in self.sentences)


# --------------------------------------------------------------------------- #
# LLM output contract (validated Gemini JSON)
# --------------------------------------------------------------------------- #
class LenientModel(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    @model_validator(mode="before")
    @classmethod
    def _null_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: (None if isinstance(v, str) and v.strip().lower() in _NULL_STRINGS else v)
                    for k, v in data.items()}
        return data


class _Conf(LenientModel):
    confidence: float = 0.5
    chunk_id: Optional[str] = None          # set by the pipeline (provenance)
    evidence_page: Optional[int] = None     # set by the verifier (page where evidence was found)

    @field_validator("confidence", mode="before")
    @classmethod
    def _conf(cls, v: Any) -> float:
        try:
            f = float(v)
        except (TypeError, ValueError):
            return 0.5
        if f > 1.0 and f <= 100.0:      # model answered in percent
            f = f / 100.0
        return max(0.0, min(1.0, f))


class AliasClaim(_Conf):
    alias: str
    alias_type: str = "other"   # nickname | short_name | honorific_form | spelling_variant | other
    confidence: float = 0.8


class RoleClaim(_Conf):
    role: str
    evidence_text: Optional[str] = None

    @field_validator("role", mode="before")
    @classmethod
    def _role(cls, v: Any) -> str:
        v = _snake(v)
        if v not in ROLES:
            raise ValueError(f"role {v!r} not allowed")
        return v


class PersonOut(_Conf):
    name: str
    aliases: list[AliasClaim] = Field(default_factory=list)
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    roles: list[RoleClaim] = Field(default_factory=list)

    @field_validator("age", mode="before")
    @classmethod
    def _age(cls, v: Any) -> Optional[int]:
        try:
            a = int(float(str(v).strip()))
        except (TypeError, ValueError):
            return None
        return a if 0 < a < 120 else None

    @field_validator("gender", mode="before")
    @classmethod
    def _gender(cls, v: Any) -> Optional[str]:
        v = _snake(v) if v else None
        return {"m": "male", "male": "male", "f": "female", "female": "female",
                "other": "other", "transgender": "other"}.get(v)

    @field_validator("aliases", "roles", mode="before")
    @classmethod
    def _none_list(cls, v: Any, info) -> Any:
        if v is None:
            return []
        key, model = ("alias", AliasClaim) if info.field_name == "aliases" else ("role", RoleClaim)
        if not isinstance(v, list):
            return []
        good = []
        for x in v:                      # drop invalid entries, keep the person
            x = {key: x} if isinstance(x, str) else x
            try:
                good.append(model.model_validate(x))
            except (ValueError, TypeError):
                continue
        return good


class PhoneOut(_Conf):
    phone_number: str
    person_name: Optional[str] = None
    phone_type: Optional[str] = None      # mobile | landline
    evidence_text: Optional[str] = None


class AccountOut(_Conf):
    account_number: Optional[str] = None
    owner_name: Optional[str] = None
    evidence_text: Optional[str] = None


class TransactionOut(_Conf):
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    sender_account_number: Optional[str] = None
    receiver_account_number: Optional[str] = None
    sender_account_owner: Optional[str] = None    # only if text says whose account
    receiver_account_owner: Optional[str] = None
    amount_text: Optional[str] = None
    date_text: Optional[str] = None
    time_text: Optional[str] = None
    reference: Optional[str] = None
    evidence_text: Optional[str] = None

    @field_validator("amount_text", "reference", "sender_account_number",
                     "receiver_account_number", mode="before")
    @classmethod
    def _to_str(cls, v: Any) -> Any:
        return None if v is None else str(v)


class RelationshipOut(_Conf):
    source_name: str
    target_name: str
    relationship_type: str = "unknown"
    description: Optional[str] = None
    evidence_text: Optional[str] = None
    uncertain: bool = False

    @field_validator("relationship_type", mode="before")
    @classmethod
    def _rt(cls, v: Any) -> str:
        v = _snake(v) if v else "unknown"
        return v if v in RELATIONSHIP_TYPES else "unknown"


class VehicleOut(_Conf):
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    make_model: Optional[str] = None
    owner_name: Optional[str] = None
    driver_name: Optional[str] = None       # driver / user / passenger
    evidence_text: Optional[str] = None

    @field_validator("vehicle_type", mode="before")
    @classmethod
    def _vt(cls, v: Any) -> Optional[str]:
        v = _snake(v) if v else None
        return v if v in VEHICLE_TYPES else None


class CallOut(_Conf):
    caller_name: Optional[str] = None
    receiver_name: Optional[str] = None
    caller_phone: Optional[str] = None
    receiver_phone: Optional[str] = None
    date_text: Optional[str] = None
    time_text: Optional[str] = None
    duration_text: Optional[str] = None
    communication_type: str = "call"
    evidence_text: Optional[str] = None

    @field_validator("communication_type", mode="before")
    @classmethod
    def _ct(cls, v: Any) -> str:
        v = _snake(v) if v else "call"
        return v if v in COMM_TYPES else "other"


class ChunkExtraction(BaseModel):
    persons: list[PersonOut] = Field(default_factory=list)
    phones: list[PhoneOut] = Field(default_factory=list)
    accounts: list[AccountOut] = Field(default_factory=list)
    transactions: list[TransactionOut] = Field(default_factory=list)
    relationships: list[RelationshipOut] = Field(default_factory=list)
    vehicles: list[VehicleOut] = Field(default_factory=list)
    calls: list[CallOut] = Field(default_factory=list)


FIELD_MODELS: dict[str, type[LenientModel]] = {
    "persons": PersonOut, "phones": PhoneOut, "accounts": AccountOut,
    "transactions": TransactionOut, "relationships": RelationshipOut,
    "vehicles": VehicleOut, "calls": CallOut,
}


class PairJudgement(_Conf):
    pair_id: int
    verdict: str = "uncertain"       # same | different | uncertain
    reason: Optional[str] = None

    @field_validator("verdict", mode="before")
    @classmethod
    def _v(cls, v: Any) -> str:
        v = _snake(v) if v else "uncertain"
        return v if v in ("same", "different", "uncertain") else "uncertain"


# --------------------------------------------------------------------------- #
# CSV row models  (field order == CSV column order)
# --------------------------------------------------------------------------- #
class PersonRow(BaseModel):
    person_id: str
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    role: Optional[str] = None
    source_id: str
    page_number: int


class AliasRow(BaseModel):
    alias_id: str
    person_id: str
    alias: str
    alias_type: str
    source_id: str
    page_number: int


class PhoneRow(BaseModel):
    phone_id: str
    person_id: Optional[str] = None
    phone_number: str
    phone_type: Optional[str] = None
    source_id: str
    page_number: int


class AccountRow(BaseModel):
    account_id: str
    account_number: Optional[str] = None
    owner_id: Optional[str] = None
    source_id: str
    page_number: int


class TransactionRow(BaseModel):
    transaction_id: str
    timestamp: Optional[str] = None
    sender_account_id: Optional[str] = None
    receiver_account_id: Optional[str] = None
    amount_inr: Optional[float] = None
    reference: Optional[str] = None
    source_id: str
    page_number: int


class RelationshipRow(BaseModel):
    relationship_id: str
    source_person_id: str
    target_person_id: str
    relationship_type: str
    description: Optional[str] = None
    evidence_text: str
    confidence: float
    source_id: str
    page_number: int


class VehicleRow(BaseModel):
    vehicle_id: str
    person_id: Optional[str] = None
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    make_model: Optional[str] = None
    source_id: str
    page_number: int


class CallRow(BaseModel):
    call_id: str
    caller_phone: Optional[str] = None
    receiver_phone: Optional[str] = None
    timestamp: Optional[str] = None
    duration_seconds: Optional[int] = None
    source_id: str
    page_number: int


class ResolvedData(BaseModel):
    persons: list[PersonRow] = Field(default_factory=list)
    aliases: list[AliasRow] = Field(default_factory=list)
    phones: list[PhoneRow] = Field(default_factory=list)
    accounts: list[AccountRow] = Field(default_factory=list)
    transactions: list[TransactionRow] = Field(default_factory=list)
    relationships: list[RelationshipRow] = Field(default_factory=list)
    vehicles: list[VehicleRow] = Field(default_factory=list)
    calls: list[CallRow] = Field(default_factory=list)


# csv file name -> (attribute on ResolvedData, row model)
TABLES: dict[str, tuple[str, type[BaseModel]]] = {
    "persons.csv": ("persons", PersonRow),
    "person_aliases.csv": ("aliases", AliasRow),
    "phones.csv": ("phones", PhoneRow),
    "accounts.csv": ("accounts", AccountRow),
    "transactions.csv": ("transactions", TransactionRow),
    "relationships.csv": ("relationships", RelationshipRow),
    "vehicles.csv": ("vehicles", VehicleRow),
    "call_records.csv": ("calls", CallRow),
}
