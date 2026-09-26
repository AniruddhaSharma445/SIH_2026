"""CSV generation (pandas). Column order comes from the row models in schemas.py."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from schemas import TABLES, ResolvedData

INT_COLUMNS = {"age", "page_number", "duration_seconds"}


def to_dataframes(data: ResolvedData) -> dict[str, pd.DataFrame]:
    frames: dict[str, pd.DataFrame] = {}
    for fname, (attr, model) in TABLES.items():
        cols = list(model.model_fields)
        rows = [r.model_dump() for r in getattr(data, attr)]
        df = pd.DataFrame(rows, columns=cols)
        for c in cols:
            if c in INT_COLUMNS:
                df[c] = df[c].astype("Int64")
            elif c == "amount_inr":       # 50000.0 -> 50000 ; 50000.5 stays
                df[c] = df[c].map(lambda x: None if pd.isna(x) else (int(x) if float(x).is_integer() else x)).astype(object)
        frames[fname] = df
    return frames


def write_csvs(data: ResolvedData, out_dir: str | Path, na_rep: str = "NULL") -> dict[str, Path]:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}
    for fname, df in to_dataframes(data).items():
        p = out / fname
        df.to_csv(p, index=False, na_rep=na_rep, encoding="utf-8")
        paths[fname] = p
    return paths
