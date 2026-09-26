import {
  Investigation,
  Entity,
  NetworkData,
  TimelineEvent,
  PatternDetection,
  AlertItem,
  DataSourceItem,
  ReportItem,
} from '../types';
import {
  mockInvestigations,
  mockEntities,
  mockRelationships,
  mockTimeline,
  mockPatterns,
  mockAlerts,
  mockDataSources,
  mockReports,
} from '../data/mockData';

/**
 * ANVESHAK API Service Layer
 *
 * This abstraction layer handles communication between the React frontend
 * and the future backend REST API (e.g. Python FastAPI / Node.js Express / PostgreSQL / Neo4j).
 *
 * Mode Configuration:
 * - If VITE_API_URL is configured (e.g. "https://api.anveshak.internal/api"),
 *   requests are dispatched via HTTP fetch to the REST backend.
 * - Otherwise (or if VITE_USE_MOCK is true), it runs in local sandbox mode with
 *   high-fidelity synthetic data and realistic async delays.
 *
 * No UI components import mockData directly; all data access goes through this layer.
 */

const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const API_BASE_URL = envObj.VITE_API_URL?.replace(/\/+$/, '') || '/api';
const FORCE_MOCK = envObj.VITE_USE_MOCK === 'true' || !envObj.VITE_API_URL;
const USE_MOCK = FORCE_MOCK;

/**
 * Simulated latency helper for realistic asynchronous UI feel
 */
const delay = (ms = 100): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to normalize and match investigation identifiers
 */
function resolveCase(idOrNumber?: string): Investigation | undefined {
  if (!idOrNumber) return mockInvestigations[0];
  const q = idOrNumber.toLowerCase().trim();
  return (
    mockInvestigations.find(
      (inv) =>
        inv.id.toLowerCase() === q ||
        inv.caseNumber.toLowerCase() === q ||
        inv.title.toLowerCase().includes(q)
    ) || mockInvestigations[0]
  );
}

export const api = {
  /**
   * Check whether the service layer is running against mock data or a live REST API
   */
  isMockMode(): boolean {
    return USE_MOCK;
  },

  /**
   * Fetch list of all active investigations
   */
  async getInvestigations(query?: string): Promise<Investigation[]> {
    if (!USE_MOCK) {
      const url = `${API_BASE_URL}/investigations${
        query ? `?q=${encodeURIComponent(query)}` : ''
      }`;
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`Failed to fetch investigations (HTTP ${res.status})`);
      return res.json();
    }

    await delay(100);
    if (!query || !query.trim()) return [...mockInvestigations];
    const q = query.toLowerCase().trim();
    return mockInvestigations.filter(
      (inv) =>
        inv.title.toLowerCase().includes(q) ||
        inv.caseNumber.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        inv.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  /**
   * Fetch a single investigation by ID or Case Number
   */
  async getInvestigationById(id: string): Promise<Investigation | null> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/investigations/${encodeURIComponent(id)}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch investigation ${id} (HTTP ${res.status})`);
      }
      return res.json();
    }

    await delay(80);
    const found = resolveCase(id);
    return found ? { ...found } : mockInvestigations[0];
  },

  /**
   * Fetch network graph (nodes and relationships) for a given case
   */
  async getNetworkData(caseId?: string): Promise<NetworkData> {
    if (!USE_MOCK) {
      const target = caseId ? encodeURIComponent(caseId) : 'default';
      const res = await fetch(`${API_BASE_URL}/investigations/${target}/network`);
      if (!res.ok) throw new Error(`Failed to fetch network graph data (HTTP ${res.status})`);
      return res.json();
    }

    await delay(80);
    const targetCaseId = caseId || 'INV-TRINETRA-001';

    // Operation Trinetra: Keep graph scoped, clean, and sober
    if (targetCaseId === 'INV-TRINETRA-001' || targetCaseId.toLowerCase().includes('trinetra')) {
      const trinetraIds = new Set([
        'ent-rohan',
        'ent-phone',
        'ent-aman',
        'ent-sbi',
        'ent-vikram',
        'ent-vehicle',
        'ent-fir',
        'ent-bhopal',
      ]);
      const trinetraNodes = mockEntities.filter((e) => trinetraIds.has(e.id));
      const trinetraEdges = mockRelationships.filter(
        (r) => trinetraIds.has(r.source) && trinetraIds.has(r.target)
      );
      return {
        nodes: JSON.parse(JSON.stringify(trinetraNodes)),
        edges: JSON.parse(JSON.stringify(trinetraEdges)),
      };
    }

    // Default or secondary cases
    const otherNodes = mockEntities.filter(
      (e) => !e.id.startsWith('ent-rohan') && e.id.startsWith('ent-0')
    );
    const otherEdges = mockRelationships.filter((r) => r.id.startsWith('rel-0'));
    return {
      nodes: JSON.parse(JSON.stringify(otherNodes.length ? otherNodes : mockEntities.slice(0, 8))),
      edges: JSON.parse(JSON.stringify(otherEdges.length ? otherEdges : mockRelationships.slice(0, 7))),
    };
  },

  /**
   * Fetch all entities linked to a case
   */
  async getEntities(caseId?: string): Promise<Entity[]> {
    if (!USE_MOCK) {
      const target = caseId ? encodeURIComponent(caseId) : 'default';
      const res = await fetch(`${API_BASE_URL}/investigations/${target}/entities`);
      if (!res.ok) throw new Error(`Failed to fetch entities (HTTP ${res.status})`);
      return res.json();
    }

    await delay(80);
    return JSON.parse(JSON.stringify(mockEntities));
  },

  /**
   * Fetch single entity by ID
   */
  async getEntityById(entityId: string): Promise<Entity | null> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/entities/${encodeURIComponent(entityId)}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch entity ${entityId} (HTTP ${res.status})`);
      }
      return res.json();
    }

    await delay(60);
    const entity = mockEntities.find((e) => e.id === entityId);
    return entity ? { ...entity } : null;
  },

  /**
   * Fetch investigation chronological timeline
   */
  async getTimeline(caseId?: string): Promise<TimelineEvent[]> {
    if (!USE_MOCK) {
      const target = caseId ? encodeURIComponent(caseId) : 'default';
      const res = await fetch(`${API_BASE_URL}/investigations/${target}/timeline`);
      if (!res.ok) throw new Error(`Failed to fetch timeline (HTTP ${res.status})`);
      return res.json();
    }

    await delay(70);
    return JSON.parse(JSON.stringify(mockTimeline));
  },

  /**
   * Fetch detected AI / topological patterns for a case
   */
  async getPatterns(caseId?: string): Promise<PatternDetection[]> {
    if (!USE_MOCK) {
      const target = caseId ? encodeURIComponent(caseId) : 'default';
      const res = await fetch(`${API_BASE_URL}/investigations/${target}/patterns`);
      if (!res.ok) throw new Error(`Failed to fetch patterns (HTTP ${res.status})`);
      return res.json();
    }

    await delay(80);
    return JSON.parse(JSON.stringify(mockPatterns));
  },

  /**
   * Fetch active alerts and priority signals
   */
  async getAlerts(caseId?: string): Promise<AlertItem[]> {
    if (!USE_MOCK) {
      const url = `${API_BASE_URL}/alerts${
        caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch alerts (HTTP ${res.status})`);
      return res.json();
    }

    await delay(60);
    if (!caseId) return JSON.parse(JSON.stringify(mockAlerts));

    const targetCase = resolveCase(caseId);
    const targetNum = targetCase?.caseNumber.toLowerCase() || caseId.toLowerCase();
    const targetId = targetCase?.id.toLowerCase() || caseId.toLowerCase();

    return mockAlerts.filter(
      (a) =>
        a.caseId.toLowerCase() === targetNum ||
        a.caseId.toLowerCase() === targetId ||
        a.caseNumber.toLowerCase() === targetNum
    );
  },

  /**
   * Fetch data source connections status
   */
  async getDataSources(): Promise<DataSourceItem[]> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/data-sources`);
      if (!res.ok) throw new Error(`Failed to fetch data sources (HTTP ${res.status})`);
      return res.json();
    }

    await delay(90);
    return JSON.parse(JSON.stringify(mockDataSources));
  },

  /**
   * Sync or refresh a specific data source stream
   */
  async syncDataSource(sourceId: string): Promise<{ success: boolean; recordsProcessed: number }> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/data-sources/${encodeURIComponent(sourceId)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to sync data source (HTTP ${res.status})`);
      return res.json();
    }

    await delay(750);
    return { success: true, recordsProcessed: Math.floor(Math.random() * 200) + 50 };
  },

  /**
   * Fetch reports repository
   */
  async getReports(): Promise<ReportItem[]> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/reports`);
      if (!res.ok) throw new Error(`Failed to fetch reports (HTTP ${res.status})`);
      return res.json();
    }

    await delay(90);
    return JSON.parse(JSON.stringify(mockReports));
  },

  /**
   * Regenerate report dossier
   */
  async generateReport(reportId: string): Promise<ReportItem> {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to generate report (HTTP ${res.status})`);
      return res.json();
    }

    await delay(850);
    const existing = mockReports.find((r) => r.id === reportId) || mockReports[0];
    return {
      ...existing,
      status: 'Ready',
      generatedDate: 'Just now (Updated)',
    };
  },

  /**
   * Global search across cases, entities, phones, accounts, vehicles
   */
  async globalSearch(query: string): Promise<{
    cases: Investigation[];
    entities: Entity[];
  }> {
    if (!query || !query.trim()) {
      return { cases: [], entities: [] };
    }

    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Failed to perform global search (HTTP ${res.status})`);
      return res.json();
    }

    await delay(70);
    const q = query.toLowerCase().trim();
    const matchedCases = mockInvestigations.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.firNumber.toLowerCase().includes(q)
    );
    const matchedEntities = mockEntities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.identifier && e.identifier.toLowerCase().includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q))
    );
    return { cases: matchedCases, entities: matchedEntities };
  },
};

export default api;
