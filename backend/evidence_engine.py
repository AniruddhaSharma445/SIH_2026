import uuid


def _new_alert_id():
    return f"ALT-{uuid.uuid4().hex[:6].upper()}"


def _reason_text(rule_type, entity_name, metrics):
    """
    human-readable one-line explanation.
    """
    if rule_type == "CIRCULAR_FLOW":
        return (f"{entity_name} is part of a closed money loop "
                f"involving {metrics.get('cycle_length', '?')} accounts.")
    if rule_type == "BRIDGE_ENTITY":
        return (f"{entity_name} structurally connects otherwise separate groups "
                f"(betweenness score = {metrics.get('betweenness', 0):.3f}).")
    if rule_type == "COMM_SPIKE":
        return f"{entity_name} shows an unusually high communication volume."
    if rule_type == "CROSSOVER":
        sources = ", ".join(metrics.get("sources", []))
        return f"{entity_name} appears across multiple independent sources: {sources}."
    return f"{entity_name} was flagged by rule {rule_type}."


def make_alert(entity_id, entity_name, rule_type, confidence, metrics, evidence_list):
    """
    Builds one standardized alert object.
    """
    return {
        "alert_id": _new_alert_id(),
        "entity_id": entity_id,
        "entity_name": entity_name,
        "rule_triggered": rule_type,
        "confidence": confidence,
        "metrics": metrics,
        "evidence": evidence_list,
        "reason_text": _reason_text(rule_type, entity_name, metrics),
    }


def build_alerts_from_detection_results(detection_results, entity_name_lookup=None):
    """
    Returns a list of clean alert objects.
    """
    entity_name_lookup = entity_name_lookup or {}
    alerts = []

    def name_of(entity_id):
        return entity_name_lookup.get(entity_id, entity_id)

    # --- Circular money flow ---
    for cycle in detection_results.get("circular_flow", []):
        for entity_id in cycle:
            alerts.append(make_alert(
                entity_id=entity_id,
                entity_name=name_of(entity_id),
                rule_type="CIRCULAR_FLOW",
                confidence=0.9,
                metrics={"cycle_length": len(cycle), "cycle_path": cycle},
                evidence_list=[{
                    "source_type": "transaction_graph",
                    "source_id": "-".join(cycle),
                    "snippet": f"Closed transfer loop: {' -> '.join(cycle)} -> {cycle[0]}"
                }]
            ))

    # --- Bridge entities ---
    for entity_id, score in detection_results.get("bridges", {}).items():
        alerts.append(make_alert(
            entity_id=entity_id,
            entity_name=name_of(entity_id),
            rule_type="BRIDGE_ENTITY",
            confidence=round(min(score * 10, 1.0), 2),
            metrics={"betweenness": score},
            evidence_list=[{
                "source_type": "graph_metric",
                "source_id": entity_id,
                "snippet": f"Betweenness centrality = {score:.4f}"
            }]
        ))

    # --- Communication spikes ---
    for u, v, data in detection_results.get("comm_spikes", []):
        alerts.append(make_alert(
            entity_id=u,
            entity_name=name_of(u),
            rule_type="COMM_SPIKE",
            confidence=data.get("confidence", 0.8),
            metrics={"target": v, "source_doc": data.get("source_doc")},
            evidence_list=[{
                "source_type": "cdr",
                "source_id": data.get("source_doc", "UNKNOWN"),
                "snippet": data.get("context", "")
            }]
        ))

    # --- Multi-source crossover ---
    for entity_id, sources in detection_results.get("crossover", {}).items():
        alerts.append(make_alert(
            entity_id=entity_id,
            entity_name=name_of(entity_id),
            rule_type="CROSSOVER",
            confidence=round(len(sources) / 3, 2),
            metrics={"sources": list(sources)},
            evidence_list=[{
                "source_type": "cross_reference",
                "source_id": entity_id,
                "snippet": f"Appears in source types: {', '.join(sources)}"
            }]
        ))

    return alerts