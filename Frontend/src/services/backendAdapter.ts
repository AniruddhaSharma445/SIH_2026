import {
  AlertItem,
  Entity,
  EntityType,
  NetworkData,
  Relationship,
  RelationshipType,
  RiskLevel,
} from '../types';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const BACKEND_URL = (env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');

/** Set VITE_USE_BACKEND=false in a .env file to go back to pure demo data. */
export const USE_BACKEND = env.VITE_USE_BACKEND !== 'false';

/** Turn this on only if graph nodes pile up in one corner. */
const ASSIGN_POSITIONS = false;

type RawRecord = Record<string, unknown>;

interface BackendEvidence {
  source_type: string;
  source_id: string;
  snippet: string;
}

interface BackendAlert {
  alert_id: string;
  entity_id: string;
  entity_name: string;
  rule_triggered: string;
  confidence: number;
  reason_text: string;
  evidence?: BackendEvidence[];
}

interface BackendAnalysis {
  nodes_count: number;
  edges_count: number;
  alerts_count: number;
  alerts: BackendAlert[];
}

interface BackendGraph {
  nodes: RawRecord[];
  edges: RawRecord[];
}

export interface UploadResult {
  status: string;
  message: string;
  data_count: number;
  resolved_files: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Backend error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// The analysis is shared by the graph and the alerts, so run it once and reuse it
let analysisCache: Promise<BackendAnalysis> | null = null;

function getAnalysis(): Promise<BackendAnalysis> {
  if (!analysisCache) {
    analysisCache = request<BackendAnalysis>('/api/analyze-graph', { method: 'POST' }).catch(
      (err) => {
        analysisCache = null;
        throw err;
      }
    );
  }
  return analysisCache;
}

export function clearBackendCache() {
  analysisCache = null;
}

function humanize(text: string): string {
  return text
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------- Risk (built from the alerts) ----------

interface RiskInfo {
  score: number;
  reasons: string[];
  roles: string[];
}

function buildRiskIndex(alerts: BackendAlert[]): Map<string, RiskInfo> {
  const index = new Map<string, RiskInfo>();
  for (const alert of alerts) {
    const info = index.get(alert.entity_id) ?? { score: 0, reasons: [], roles: [] };
    info.score = Math.max(info.score, alert.confidence);
    info.reasons.push(alert.reason_text);
    info.roles.push(humanize(alert.rule_triggered));
    index.set(alert.entity_id, info);
  }
  return index;
}

function riskLevelFor(score: number | undefined): RiskLevel {
  if (score === undefined) return 'neutral';
  return score >= 0.85 ? 'high' : 'warning';
}

// ---------- Nodes ----------

const KNOWN_TYPES: EntityType[] = ['person', 'phone', 'account', 'vehicle', 'location', 'fir', 'case'];

function inferEntityType(node: RawRecord): EntityType {
  const declared = String(node.type ?? node.entity_type ?? node.node_type ?? '').toLowerCase();
  const exact = KNOWN_TYPES.find((t) => t === declared);
  if (exact) return exact;
  if (declared.includes('phone') || declared.includes('mobile')) return 'phone';
  if (declared.includes('account') || declared.includes('bank')) return 'account';
  if (declared.includes('vehicle') || declared.includes('plate')) return 'vehicle';
  if (declared.includes('location') || declared.includes('place')) return 'location';
  if (declared.includes('person') || declared.includes('suspect')) return 'person';

  const id = String(node.id).toUpperCase();
  const label = String(node.label ?? node.id).replace(/[\s-]/g, '').toUpperCase();

  if (/^PH[-_]?\d/.test(id)) return 'phone';
  if (/^(V|VEH)[-_]\d/.test(id)) return 'vehicle';
  if (/^(A|AC|ACC)[-_]\d/.test(id)) return 'account';
  if (/^(L|LOC)[-_]\d/.test(id)) return 'location';
  if (/^FIR[-_]?\d/.test(id)) return 'fir';
  if (/^CASE[-_]?\d/.test(id)) return 'case';
  if (/^P[-_]\d/.test(id)) return 'person';
  if (/^[6-9]\d{9}$/.test(label)) return 'phone';
  if (/^\d{9,18}$/.test(label)) return 'account';
  if (/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(label)) return 'vehicle';
  return 'person';
}

function toEntity(node: RawRecord, risk: Map<string, RiskInfo>): Entity {
  const id = String(node.id);
  const name = String(node.label ?? node.name ?? id);
  const type = inferEntityType(node);
  const info = risk.get(id);

  const metadata: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'id' || key === 'label') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      metadata[key] = value;
    }
  }

  return {
    id,
    name,
    type,
    identifier: type === 'person' ? undefined : name,
    role: info ? info.roles.join(', ') : undefined,
    riskLevel: riskLevelFor(info?.score),
    flaggedReasons: info?.reasons,
    metadata,
  };
}

// ---------- Edges ----------

function toRelationshipType(raw: unknown): RelationshipType {
  const t = String(raw ?? '').toUpperCase();
  if (t.includes('CALL')) return 'CALLED';
  if (t.includes('TRANSFER') || t.includes('TXN') || t.includes('PAID')) return 'TRANSFERRED_TO';
  if (t.includes('OWN') || t.includes('USES') || t.includes('REGISTER')) return 'OWNED_BY';
  if (t.includes('TRAVEL') || t.includes('VISIT')) return 'TRAVELED_TO';
  if (t.includes('MENTION') || t.includes('FIR')) return 'MENTIONED_IN';
  return 'CONNECTED_TO';
}

function toRelationship(edge: RawRecord, index: number): Relationship {
  const rawType = edge.type ?? edge.relation ?? edge.relationship;
  const weight = Number(edge.weight ?? edge.confidence);
  return {
    id: `rel-live-${index}`,
    source: String(edge.source),
    target: String(edge.target),
    type: toRelationshipType(rawType),
    label: rawType ? humanize(String(rawType)) : undefined,
    details: typeof edge.context === 'string' ? edge.context : undefined,
    weight: Number.isFinite(weight) ? weight : undefined,
    riskLevel: edge.suspicious === true ? 'warning' : undefined,
  };
}

function assignRingLayout(nodes: Entity[]): Entity[] {
  const width = 1000;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 60;
  return nodes.map((node, i) => {
    if (i === 0) return { ...node, x: centerX, y: centerY };
    const angle = ((i - 1) / (nodes.length - 1)) * Math.PI * 2;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

// ---------- Public functions used by api.ts ----------

export async function getLiveNetworkData(): Promise<NetworkData> {
  const [graph, analysis] = await Promise.all([
    request<BackendGraph>('/api/graph'),
    getAnalysis(),
  ]);

  const risk = buildRiskIndex(analysis.alerts ?? []);
  const scoreOf = (entity: Entity) => risk.get(entity.id)?.score ?? -1;

  // Most suspicious entity first, so pages that pick nodes[0] show the key suspect
  let nodes = graph.nodes.map((n) => toEntity(n, risk)).sort((a, b) => scoreOf(b) - scoreOf(a));

  const knownIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges
    .map(toRelationship)
    .filter((e) => knownIds.has(e.source) && knownIds.has(e.target));

  if (ASSIGN_POSITIONS) nodes = assignRingLayout(nodes);
  return { nodes, edges };
}

export async function getLiveAlerts(caseId: string, caseNumber: string): Promise<AlertItem[]> {
  const analysis = await getAnalysis();
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (analysis.alerts ?? []).map((alert): AlertItem => {
    const severity = alert.confidence >= 0.85 ? 'high' : alert.confidence >= 0.6 ? 'warning' : 'info';
    return {
      id: alert.alert_id,
      title: humanize(alert.rule_triggered),
      message: alert.reason_text,
      severity,
      timestamp: today,
      caseId,
      caseNumber,
      entityName: alert.entity_name,
      entityId: alert.entity_id,
      read: false,
      alertType: humanize(alert.rule_triggered),
      entity: alert.entity_name,
      reason: alert.reason_text,
      date: today,
      risk: severity === 'high' ? 'High' : severity === 'warning' ? 'Medium' : 'Low',
    };
  });
}

export async function uploadCaseFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await request<UploadResult>('/api/upload', { method: 'POST', body: formData });
  clearBackendCache(); // new data in the database, so the next graph/alert load must re-run the analysis
  return result;
}

export async function sendChatMessage(message: string): Promise<string> {
  const data = await request<{ response?: string; message?: string }>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return data.response ?? data.message ?? '';
}