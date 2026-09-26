import re
import pandas as pd
from rapidfuzz import fuzz


def normalize_name(name):
    name = str(name).lower().strip()
    name = re.sub(r"[.,]", "", name)
    name = re.sub(r"\s+", " ", name)
    return name


def cluster_names(names, threshold=80):
    clusters = []
    name_to_cluster_index = {}

    for name in names:
        norm = normalize_name(name)
        best_match_index = None
        best_score = 0

        for i, cluster in enumerate(clusters):
            score = fuzz.token_set_ratio(norm, cluster["representative"])
            if score > best_score:
                best_score = score
                best_match_index = i

        if best_match_index is not None and best_score >= threshold:
            clusters[best_match_index]["members"].append(name)
            name_to_cluster_index[name] = best_match_index
            if len(norm) > len(clusters[best_match_index]["representative"]):
                clusters[best_match_index]["representative"] = norm
        else:
            clusters.append({"representative": norm, "members": [name]})
            name_to_cluster_index[name] = len(clusters) - 1

    name_to_canonical_id = {}
    canonical_id_to_display_name = {}
    for i, cluster in enumerate(clusters):
        canonical_id = f"P-{i+1:03d}"
        display_name = max(cluster["members"], key=len)
        canonical_id_to_display_name[canonical_id] = display_name
        for member in cluster["members"]:
            name_to_canonical_id[member] = canonical_id

    return name_to_canonical_id, canonical_id_to_display_name


def run_resolution(raw_extraction_df, threshold=80):
    # Standardize column mapping if raw database headers are supplied
    db_to_extraction_map = {
        "source_entity_id": "Name A",
        "target_entity_id": "Name B",
        "type": "Relation",
        "source_document_id": "Source ID",
        "context": "Context",
        "confidence": "Confidence"
    }
    raw_extraction_df = raw_extraction_df.rename(columns=db_to_extraction_map)

    required = {"Name A", "Name B", "Relation", "Source ID", "Context", "Confidence"}
    missing = required - set(raw_extraction_df.columns)
    if missing:
        raise ValueError(f"Extraction output missing expected columns: {missing}")

    all_names = pd.concat([raw_extraction_df["Name A"], raw_extraction_df["Name B"]]).unique()
    name_to_id, id_to_display_name = cluster_names(all_names, threshold=threshold)

    resolved_rows = []
    self_loops_removed = 0
    for _, row in raw_extraction_df.iterrows():
        source_id = name_to_id[row["Name A"]]
        target_id = name_to_id[row["Name B"]]
        if source_id == target_id:
            self_loops_removed += 1
            continue
        resolved_rows.append({
            "source_entity_id": source_id,
            "target_entity_id": target_id,
            "type": row["Relation"],
            "confidence": row["Confidence"],
            "source_document_id": row["Source ID"],
            "context": row["Context"],
        })

    if self_loops_removed > 0:
        print(f"[resolution] Removed {self_loops_removed} self-loop row(s) "
              f"where both names resolved to the same entity.")

    resolved_df = pd.DataFrame(resolved_rows)
    return resolved_df, id_to_display_name