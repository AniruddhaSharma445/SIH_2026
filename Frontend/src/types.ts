export type EntityType = 'person' | 'phone' | 'account' | 'vehicle' | 'location' | 'fir' | 'case';

export type RelationshipType =
  | 'CALLED'
  | 'TRANSFERRED_TO'
  | 'OWNED_BY'
  | 'TRAVELED_TO'
  | 'MENTIONED_IN'
  | 'CONNECTED_TO';

export type RiskLevel = 'high' | 'warning' | 'verified' | 'neutral';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  identifier?: string; // e.g. Phone number, Account #, Plate #, Address
  role?: string; // e.g. "Primary Target", "Account Holder", "SIM Registrant"
  riskLevel: RiskLevel;
  flaggedReasons?: string[];
  notes?: string;
  firstDetected?: string;
  lastSeen?: string;
  dataSources?: string[];
  metadata?: Record<string, string | number | boolean>;
  x?: number;
  y?: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  details?: string;
  weight?: number;
  riskLevel?: RiskLevel;
  timestamp?: string;
}

export interface NetworkData {
  nodes: Entity[];
  edges: Relationship[];
}

export interface Investigation {
  id: string;
  caseNumber: string;
  title: string;
  status: 'Active' | 'Under Review' | 'Closed' | 'Priority Investigation';
  priority: 'High' | 'Medium' | 'Critical' | 'Standard';
  description: string;
  location: string;
  createdDate: string;
  updatedDate: string;
  leadInvestigator: string;
  department: string;
  firNumber: string;
  stats: {
    personsCount: number;
    phonesCount: number;
    accountsCount: number;
    vehiclesCount: number;
    highRiskCount: number;
  };
  tags: string[];
}

export interface TimelineEvent {
  id: string;
  stepNumber: string; // e.g. "01", "02"
  title: string;
  date: string;
  time?: string;
  description: string;
  category: 'FIR' | 'CDR' | 'Financial' | 'Field Intel' | 'Network Analysis';
  status: 'Verified' | 'Flagged' | 'Analyzed' | 'Pending Review';
  relatedEntityName?: string;
  relatedEntityId?: string;
}

export interface PatternDetection {
  id: string;
  type: 'communication_spike' | 'circular_money' | 'bridge_entity' | 'multi_source';
  title: string;
  badge: string;
  description: string;
  severity: 'High Risk' | 'Suspicious' | 'Notice';
  entitiesInvolved: string[];
  metrics: string;
  analyticalNote: string;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'warning' | 'info';
  timestamp: string;
  caseId: string;
  caseNumber: string;
  entityName?: string;
  entityId?: string;
  read?: boolean;
  alertType?: string;
  entity?: string;
  reason?: string;
  date?: string;
  risk?: 'High' | 'Medium' | 'Low';
}

export interface DataSourceItem {
  id: string;
  name: string;
  category: string;
  status: 'Connected' | 'Syncing' | 'Offline' | 'Simulated Stream';
  recordCount: number;
  lastUpdated: string;
  format: string;
  description: string;
  confidenceScore: number;
  provider: string;
}

export interface ReportItem {
  id: string;
  title: string;
  type: 'Investigation Summary' | 'Network Analysis Report' | 'Entity Relationship Report' | 'Pattern Detection Report';
  caseNumber: string;
  description: string;
  generatedDate: string;
  generatedBy: string;
  status: 'Ready' | 'Draft' | 'Archived';
  fileSize: string;
  pages: number;
}
