"""
graph_analysis.py
Project: Anveshak

Module - Database & Graph
Build the NetworkX graph from stored relationships (PostgreSQL),
run centrality/path/component/community analysis, and implement the four
detection rules (communication spike, circular money flow, bridge entity,
multi-source crossover).
"""

import pandas as pd
import networkx as nx
import numpy as np
import re
from networkx.algorithms import community

try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


class GraphAnalyzer:
    """
    Builds and analyzes the criminal-network relationship graph.

    Two ways to load data:
      1. From PostgreSQL  -> GraphAnalyzer(db_config={...})
      2. From a local CSV -> GraphAnalyzer(csv_path="relationships_seed.csv")
    """

    def __init__(self, db_config=None, csv_path=None):
        self.db_config = db_config
        self.csv_path = csv_path
        self.G = None          # MultiDiGraph - full graph, all relation types
        self.G_simple = None   # simple undirected Graph - used for centrality/components

    # ------------------------------------------------------------------
    # DATA LOADING
    # ------------------------------------------------------------------
    def _fetch_relationships_from_db(self):
        if not PSYCOPG2_AVAILABLE:
            raise ImportError("psycopg2 is not installed. Run: pip install psycopg2-binary")

        query = """
            SELECT source_entity_id, target_entity_id, relationship_type AS type,
                   confidence, source_document_id, context
            FROM relationships;
        """
        import os
        try:
            db_url = self.db_config if isinstance(self.db_config, str) else os.getenv("DATABASE_URL")
            conn = psycopg2.connect(db_url)
            df = pd.read_sql(query, conn)
            conn.close()
            return df
        except Exception as e:
            raise ConnectionError(f"Failed to fetch relationships from DB: {e}")

    def _fetch_relationships_from_csv(self):
        return pd.read_csv(self.csv_path)
        
    def load_from_dataframe(self, resolved_df):
        required_cols = {
            "source_entity_id",
            "target_entity_id",
            "type",
            "confidence",
            "source_document_id",
            "context"
        }

        missing = required_cols - set(resolved_df.columns)
        if missing:
            raise ValueError(f"Relationship DataFrame is missing required columns: {missing}")

        G = nx.MultiDiGraph()
        for _, row in resolved_df.iterrows():
            if pd.isna(row["source_entity_id"]) or pd.isna(row["target_entity_id"]):
                continue

            G.add_edge(
                row["source_entity_id"],
                row["target_entity_id"],
                relation=row["type"],
                confidence=row["confidence"],
                source_doc=row["source_document_id"],
                context=row["context"],
            )

        self.G = G
        self.G_simple = nx.Graph(G)
        return self.G

    # ------------------------------------------------------------------
    # GRAPH CONSTRUCTION
    # ------------------------------------------------------------------
    def build_graph(self):
        if self.db_config is not None:
            rel_df = self._fetch_relationships_from_db()
        elif self.csv_path is not None:
            rel_df = self._fetch_relationships_from_csv()
        else:
            rel_df = self._fetch_relationships_from_csv()

        required_cols = {"source_entity_id", "target_entity_id", "type",
                          "confidence", "source_document_id", "context"}
        missing = required_cols - set(rel_df.columns)
        if missing:
            raise ValueError(f"Relationship data is missing required columns: {missing}")

        G = nx.MultiDiGraph()
        for _, row in rel_df.iterrows():
            if pd.isna(row["source_entity_id"]) or pd.isna(row["target_entity_id"]):
                continue
            G.add_edge(
                row["source_entity_id"], row["target_entity_id"],
                relation=row["type"],
                confidence=row["confidence"],
                source_doc=row["source_document_id"],
                context=row["context"],
            )

        self.G = G
        self.G_simple = nx.Graph(G)
        return self.G

    def _check_graph_built(self):
        if self.G is None:
            raise RuntimeError("Graph not built yet. Call build_graph() first.")

    # ------------------------------------------------------------------
    # ANALYSIS METRICS
    # ------------------------------------------------------------------
    def get_degree(self):
        self._check_graph_built()
        return dict(self.G.in_degree()), dict(self.G.out_degree()), dict(self.G.degree())

    def get_betweenness(self):
        self._check_graph_built()
        return nx.betweenness_centrality(self.G_simple)

    def get_shortest_path(self, source, target):
        self._check_graph_built()
        if not nx.has_path(self.G, source, target):
            return None, None
        path = nx.shortest_path(self.G, source=source, target=target)
        length = nx.shortest_path_length(self.G, source=source, target=target)
        return path, length

    def get_connected_components(self):
        self._check_graph_built()
        return list(nx.connected_components(self.G_simple))

    def get_communities(self):
        self._check_graph_built()
        return list(community.greedy_modularity_communities(self.G_simple))

    # ------------------------------------------------------------------
    # DETECTION RULE 1: CIRCULAR MONEY FLOW (UPDATED)
    # ------------------------------------------------------------------
    def detect_circular_flow(self):
        """
        Finds closed directed loops among transfer edges (TRANSFERRED or TRANSFERRED_FUNDS).
        Returns a list of cycles, each cycle a list of entity IDs.
        """
        self._check_graph_built()
        money_graph = nx.DiGraph()
        target_relations = {"TRANSFERRED", "TRANSFERRED_FUNDS"}

        for u, v, data in self.G.edges(data=True):
            rel_type = str(data.get("relation", "")).upper()
            if any(tr in rel_type for tr in target_relations):
                money_graph.add_edge(u, v)

        return list(nx.simple_cycles(money_graph))

    # ------------------------------------------------------------------
    # DETECTION RULE 2: BRIDGE ENTITY
    # ------------------------------------------------------------------
    def detect_bridges(self, percentile=75):
        self._check_graph_built()
        bc = self.get_betweenness()
        if not bc:
            return {}
        threshold = np.percentile(list(bc.values()), percentile)
        return {n: s for n, s in bc.items() if s >= threshold and s > 0}

    # ------------------------------------------------------------------
    # DETECTION RULE 3: COMMUNICATION SPIKE (UPDATED)
    # ------------------------------------------------------------------
    def detect_comm_spikes(self, spike_marker="SPIKE", min_calls=5):
        """
        Detect unusually high communication volume.

        A communication edge is flagged when:
        1. relationship type is COMMUNICATED_SPIKE, OR
        2. source document contains a SPIKE marker, OR
        3. context contains a call count >= min_calls.
        """
        self._check_graph_built()
        flagged = []

        for u, v, data in self.G.edges(data=True):
            rel_type = str(data.get("relation", "")).upper()
            source_doc = str(data.get("source_doc", "")).upper()
            context = str(data.get("context", ""))

            is_spike = "COMMUNICATED_SPIKE" in rel_type

            if not is_spike:
                is_spike = (
                    ("CONTACTED" in rel_type or "COMMUNICATED" in rel_type)
                    and spike_marker.upper() in source_doc
                )

            if not is_spike:
                match = re.search(r"(\d+)\s+call", context, re.IGNORECASE)
                if match:
                    is_spike = int(match.group(1)) >= min_calls

            if is_spike:
                flagged.append((u, v, data))

        return flagged

    # ------------------------------------------------------------------
    # DETECTION RULE 4: MULTI-SOURCE CROSSOVER
    # ------------------------------------------------------------------
    def detect_crossover(self):
        """
        Detect entities appearing across multiple independent source types.

        Project source IDs can be FIR_TEXT, CDR_LOGS, BANK_TXN, etc.
        They are normalized to FIR, CDR and FIN.
        """
        self._check_graph_built()
        node_sources = {}

        def classify_source(source_doc, relation):
            source = str(source_doc).upper()
            relation = str(relation).upper()

            if "FIR" in source:
                return "FIR"

            if (
                "CDR" in source
                or "CALL" in source
                or "COMMUNICATED" in relation
                or "CONTACTED" in relation
            ):
                return "CDR"

            if (
                "FIN" in source
                or "BANK" in source
                or "TXN" in source
                or "TRANSACTION" in source
                or "TRANSFERRED" in relation
            ):
                return "FIN"

            return source.split("_")[0] if source else "UNKNOWN"

        for u, v, data in self.G.edges(data=True):
            source_type = classify_source(
                data.get("source_doc", ""),
                data.get("relation", "")
            )

            for node in (u, v):
                node_sources.setdefault(node, set()).add(source_type)

        return {
            node: sources
            for node, sources in node_sources.items()
            if len(sources) >= 2
        }

    # ------------------------------------------------------------------
    # PIPELINE ENTRY POINT
    # ------------------------------------------------------------------
    def run_all_detections(self):
        self._check_graph_built()
        return {
            "circular_flow": self.detect_circular_flow(),
            "bridges": self.detect_bridges(),
            "comm_spikes": self.detect_comm_spikes(),
            "crossover": self.detect_crossover(),
        }

# OUTPUT
# Nodes: 18
# Edges: 18

# Top in-degree: [('P-002', 3), ('P-001', 2), ('P-003', 2)]

# Connected components: 5
# Communities found: 6

# circular_flow: [['P-003', 'P-001']]
# bridges: {  'P-002': 0.06985294117647059, 
#             'P-007': 0.058823529411764705, 
#             'P-008': 0.03676470588235294, 
#             'P-010': 0.007352941176470588, 
#             'P-014': 0.007352941176470588, 
#             'P-017': 0.007352941176470588}
# comm_spikes: [('P-001', 'P-002', {'relation': 'CONTACTED', 'confidence': 0.97, 'source_doc': 'CDR_SPIKE_01', 'context': "Repeated calls from Rahul's phone to Amit's phone."})]
# crossover: {'P-001': {'FIR', 'FIN', 'CDR'}, 'P-002': {'FIR', 'FIN', 'CDR'}, 'P-003': {'FIR', 'FIN'}, 'P-004': {'FIR', 'FIN', 'CDR'}, 'P-007': {'FIR', 'FIN'}}
