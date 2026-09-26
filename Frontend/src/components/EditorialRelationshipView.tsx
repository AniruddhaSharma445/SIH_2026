import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Phone,
  Landmark,
  MapPin,
  FileText,
  Truck,
  Building2,
  User,
  RotateCcw,
  CheckCircle2,
  Layers,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSearch,
  Search,
} from 'lucide-react';

// Modals for deep-dive investigation evidence
import { CallRecordsModal } from './CallRecordsModal';
import { BankingLedgerModal } from './BankingLedgerModal';
import { VehicleLogsModal } from './VehicleLogsModal';
import { FirDocumentModal } from './FirDocumentModal';

export type EntityCategory = 'person' | 'organization' | 'financial' | 'telecom' | 'vehicle' | 'location' | 'document';

export interface RelationshipNode {
  id: string;
  name: string;
  subtitle: string;
  category: EntityCategory;
  isCenter?: boolean;
  tier: 1 | 2; // 1 = core suspect ring (6 nodes), 2 = satellite evidence/accounts
  x: number;
  y: number;
  status: 'Needs review' | 'Resolved';
  details: {
    pid?: string;
    role: string;
    association?: string;
    locations?: string[];
    aliases?: string[];
    recentActivity?: string;
    description: string;
    metrics: string;
    confidence: string;
    flagReason?: string;
    sourceDoc?: string;
    evidenceType?: 'call' | 'banking' | 'vehicle' | 'fir';
    directLinks?: Array<{ name: string; id: string; relation: string }>;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
  dashed?: boolean;
  type: 'financial' | 'telecom' | 'logistics' | 'legal' | 'direct';
  evidence?: string;
}

interface EditorialRelationshipViewProps {
  onSelectEntity?: (entityId: string) => void;
  selectedEntityId?: string;
  onInvestigateEntity?: (entityId: string) => void;
}

// Calibrated coordinates for 960 x 540 viewBox with balanced quadrants
const INITIAL_NODES: RelationshipNode[] = [
  // Center Bridge Entity: Rahul Sharma (P-001)
  {
    id: 'ent-rahul',
    name: 'Rahul Sharma',
    subtitle: 'bridge entity',
    category: 'person',
    isCenter: true,
    tier: 1,
    x: 480,
    y: 270,
    status: 'Needs review',
    details: {
      pid: 'P-001',
      role: 'Primary Person of Interest & Bridge Entity',
      association: 'CASE-2026-014 Syndicate (Central Bhopal Hub)',
      locations: ['Bhopal Central', 'New Market', 'Sehore Road', 'Habibganj'],
      aliases: ['Rahul K Sharma', 'R. Sharma', 'rahulsharma'],
      recentActivity: 'CDR Spike · 9 Aug 2026 11:24',
      confidence: '97.2%',
      metrics: '18 Burst Calls • ₹38,000 Volume • MP04AB1234',
      description:
        'Main bridging entity connecting telecom communications (18-call burst in CDR_SPIKE_01), circular money flow (FIN_001), and road transit across Bhopal.',
      flagReason: 'Communication spike: 18 burst calls and closed circular return transfer of ₹7,500.',
      sourceDoc: 'FIR_001, FIR_009, FIR_010, CDR_SPIKE_01, FIN_001',
      evidenceType: 'call',
      directLinks: [
        { name: 'Amit Verma', id: 'ent-amit', relation: 'Contacted (FIR_001 & CDR)' },
        { name: 'Suresh Patel', id: 'ent-suresh', relation: 'Circular Return (₹7,500)' },
        { name: 'Neeraj Khan', id: 'ent-neeraj', relation: 'Sehore Road Meeting' },
        { name: 'Vikram Singh', id: 'ent-vikram', relation: 'Spike Intercepts' },
        { name: 'A/C 4567891201', id: 'ent-sbi-acct', relation: 'Primary Account (AC-001)' },
        { name: 'MP04AB1234', id: 'ent-vehicle-rahul', relation: 'Primary Vehicle (VH-001)' },
      ],
    },
  },

  // 1. Top-Left: Operational Associate (Amit Verma)
  {
    id: 'ent-amit',
    name: 'Amit Verma',
    subtitle: 'delivery contact',
    category: 'person',
    tier: 1,
    x: 250,
    y: 155,
    status: 'Needs review',
    details: {
      pid: 'P-002',
      role: 'Operating Associate & Delivery Contact',
      association: 'Bhopal Syndicate (New Market & Habibganj Hub)',
      locations: ['New Market, Bhopal', 'Habibganj Station'],
      aliases: ['Amit Verma', 'amitverma'],
      recentActivity: 'FIR_001 · 1 Aug 2026',
      confidence: '96.0%',
      metrics: '18 Burst Calls Received • ₹18.5k Credit',
      description:
        'Met Rahul Sharma near New Market to coordinate delivery (FIR_001). Received ₹18,500 from AC-001 and transferred ₹12,000 to Suresh Patel (FIN_001).',
      sourceDoc: 'FIR_001, FIR_002, FIR_009, FIN_001, CDR_SPIKE_01',
      evidenceType: 'fir',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Delivery Planning' },
        { name: 'FIR_001 Docket', id: 'ent-fir-001', relation: 'Named Associate' },
        { name: 'MP04CD5678', id: 'ent-vehicle-amit', relation: 'Transit Vehicle' },
      ],
    },
  },
  {
    id: 'ent-fir-001',
    name: 'FIR_001 Docket',
    subtitle: 'legal extract',
    category: 'document',
    tier: 2,
    x: 110,
    y: 90,
    status: 'Resolved',
    details: {
      pid: 'FIR_001',
      role: 'Primary Legal Charge Sheet / Station Diary',
      association: 'Bhopal Central Police Station',
      locations: ['Bhopal Central', 'New Market'],
      aliases: ['CASE-2026-014 Reference'],
      recentActivity: 'FIR Register · 1 Aug 2026',
      confidence: '99.2%',
      metrics: 'Sec 420/120B • CCTNS Bhopal Ref',
      description:
        'Official FIR recording meeting between Rahul K Sharma and Amit Verma near New Market, noting vehicle MP04AB1234 and phone 9000010000.',
      sourceDoc: 'Bhopal Central Police Station CCTNS Docket',
      evidenceType: 'fir',
      directLinks: [
        { name: 'Amit Verma', id: 'ent-amit', relation: 'Named Associate' },
        { name: 'MP04CD5678', id: 'ent-vehicle-amit', relation: 'Corroborated Plate' },
      ],
    },
  },
  {
    id: 'ent-vehicle-amit',
    name: 'MP04CD5678',
    subtitle: 'shared vehicle',
    category: 'vehicle',
    tier: 2,
    x: 115,
    y: 220,
    status: 'Resolved',
    details: {
      pid: 'VH-002',
      role: 'Transit Vehicle (Amit Verma / Suresh Patel)',
      association: 'Sighted at Habibganj station in FIR_002',
      locations: ['Habibganj Station, Bhopal'],
      aliases: ['VH-002 Sighting'],
      recentActivity: 'Sighting Log · 2 Aug 2026',
      confidence: '91.0%',
      metrics: 'Witness Verification • Sighted Habibganj',
      description:
        'Vehicle used by Suresh Patel to meet Amit Verma near Habibganj station. Referenced in case CASE-2026-014.',
      sourceDoc: 'FIR_002 Police Sighting Record',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'Amit Verma', id: 'ent-amit', relation: 'Transit Passenger' },
        { name: 'FIR_001 Docket', id: 'ent-fir-001', relation: 'Case Docket' },
      ],
    },
  },
  {
    id: 'ent-vehicle-rahul',
    name: 'MP04AB1234',
    subtitle: 'primary vehicle',
    category: 'vehicle',
    tier: 1,
    x: 480,
    y: 110,
    status: 'Needs review',
    details: {
      pid: 'VH-001',
      role: 'Primary Transportation Asset',
      association: 'Registered to Rahul Sharma (owner_id: 1)',
      locations: ['New Market, Bhopal Central', 'Sehore Road'],
      aliases: ['Black SUV MP04AB1234'],
      recentActivity: 'ANPR Hit · 1 Aug 2026 10:15',
      confidence: '98.5%',
      metrics: 'Logged in FIR_001 • FASTag Checkpost',
      description:
        'Registered in Bhopal (MP-04) to Rahul Sharma. Recorded at New Market delivery meeting and regional transit checkposts.',
      sourceDoc: 'FIR_001 & State Highway ANPR Feeds',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Registered Owner (P-001)' },
      ],
    },
  },

  // 2. Top-Right: Circular Flow Mule (Suresh Patel)
  {
    id: 'ent-suresh',
    name: 'Suresh Patel',
    subtitle: 'circular mule',
    category: 'person',
    tier: 1,
    x: 710,
    y: 155,
    status: 'Needs review',
    details: {
      pid: 'P-003',
      role: 'Circular Transfer Mule & Intermediary',
      association: 'Bhopal Syndicate (Habibganj Node)',
      locations: ['Habibganj Station, Bhopal', 'Bhopal Central'],
      aliases: ['Suresh Patel', 'sureshpatel'],
      recentActivity: 'Bank Transfer · 7 Aug 2026 15:10',
      confidence: '95.0%',
      metrics: '₹7,500 Return Transfer • Phone 9000010002',
      description:
        'Met Amit Verma at Habibganj (FIR_002). Received ₹12,000 from AC-002 and transferred ₹7,500 back to AC-001 (Rahul Sharma), completing the circular loop.',
      sourceDoc: 'FIR_002, FIR_010, FIN_001, CDR_SPIKE_01',
      evidenceType: 'banking',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Return Transfer ₹7,500' },
        { name: 'A/C 4567891203', id: 'ent-acct-suresh', relation: 'Account Mandate' },
      ],
    },
  },
  {
    id: 'ent-acct-suresh',
    name: 'A/C 4567891203',
    subtitle: 'mule account',
    category: 'financial',
    tier: 2,
    x: 855,
    y: 95,
    status: 'Needs review',
    details: {
      pid: 'AC-003',
      role: 'Circular Intermediary Ledger',
      association: 'Associated with Suresh Patel (owner_id: 3)',
      locations: ['Bhopal Central Banking Gateway'],
      aliases: ['AC-003 (Suresh Patel)'],
      recentActivity: 'TXN_003 · 7 Aug 2026 15:10',
      confidence: '99.0%',
      metrics: '₹12k In / ₹7.5k Out (Circular Flow)',
      description:
        'Account cited in FIR_010 and FIN_001. Executed TXN_003 return transfer to AC-001 (Rahul Sharma) closing the circular money flow.',
      flagReason: 'Circular transfer closing fund circuit back to origin account.',
      sourceDoc: 'Core Banking Gateway FIN_001 & FIR_010',
      evidenceType: 'banking',
      directLinks: [
        { name: 'Suresh Patel', id: 'ent-suresh', relation: 'Account Owner' },
      ],
    },
  },

  // 3. Bottom-Right: Regional Transporter (Neeraj Khan)
  {
    id: 'ent-neeraj',
    name: 'Neeraj Khan',
    subtitle: 'regional contact',
    category: 'person',
    tier: 1,
    x: 710,
    y: 385,
    status: 'Needs review',
    details: {
      pid: 'P-004',
      role: 'Regional Transporter (Sehore Corridor)',
      association: 'Bhopal Syndicate (Sehore Road Node)',
      locations: ['Sehore Road, Bhopal', 'Habibganj'],
      aliases: ['N. Khan', 'neerajkhan'],
      recentActivity: 'Field Intel · 3 Aug 2026',
      confidence: '93.0%',
      metrics: 'Vehicle MP04EF9012 • Phone 9000010003',
      description:
        'Recorded meeting Rahul Sharma at roadside restaurant on Sehore Road using MP04EF9012. Known to Amit Verma. Originator of secondary circular transfer loop (FIN_002).',
      flagReason: 'Secondary money layering and repeated coordination during CDR_SPIKE_01.',
      sourceDoc: 'FIR_003, FIR_009, FIR_010, FIN_002, FIN_003',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Sehore Road Meeting' },
        { name: 'MP04EF9012', id: 'ent-vehicle-neeraj', relation: 'Vehicle Used' },
        { name: 'A/C 4567891204', id: 'ent-acct-04', relation: 'Secondary Loop' },
      ],
    },
  },
  {
    id: 'ent-vehicle-neeraj',
    name: 'MP04EF9012',
    subtitle: 'transit car',
    category: 'vehicle',
    tier: 2,
    x: 855,
    y: 440,
    status: 'Resolved',
    details: {
      pid: 'VH-003',
      role: 'Regional Transit Vehicle',
      association: 'Registered to Neeraj Khan (owner_id: 4)',
      locations: ['Sehore Road roadside restaurant'],
      aliases: ['VH-003'],
      recentActivity: 'Field Observation · 3 Aug 2026',
      confidence: '95.5%',
      metrics: 'Sighted on Sehore Road in FIR_003',
      description:
        'Vehicle used by Neeraj Khan for meeting with Rahul Sharma at Sehore Road restaurant.',
      sourceDoc: 'FIR_003 Police Case Docket',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'Neeraj Khan', id: 'ent-neeraj', relation: 'Registered Owner' },
      ],
    },
  },
  {
    id: 'ent-acct-04',
    name: 'A/C 4567891204',
    subtitle: 'secondary loop',
    category: 'financial',
    tier: 2,
    x: 850,
    y: 280,
    status: 'Needs review',
    details: {
      pid: 'AC-004',
      role: 'Secondary Financial Layering Account',
      association: 'Associated with Neeraj Khan (owner_id: 4)',
      locations: ['Bhopal Central Banking Gateway'],
      aliases: ['AC-004 (Neeraj Khan)'],
      recentActivity: 'TXN_004 · 8 Aug 2026 10:20',
      confidence: '96.2%',
      metrics: '₹9.1k to AC-005 • ₹4.3k return',
      description:
        'Secondary circular transfer loop: AC-004 -> AC-005 -> AC-006 -> AC-004 (FIN_002) and cross-layer transfer to AC-001 (TXN_015).',
      flagReason: 'Secondary closed loop fund dispersion.',
      sourceDoc: 'FIN_002 & FIN_003 Ledgers',
      evidenceType: 'banking',
      directLinks: [
        { name: 'Neeraj Khan', id: 'ent-neeraj', relation: 'Account Mandate' },
      ],
    },
  },

  // 4. Bottom-Center: Originating Banking Mandate (AC-001)
  {
    id: 'ent-sbi-acct',
    name: 'A/C 4567891201',
    subtitle: 'origin account',
    category: 'financial',
    tier: 1,
    x: 480,
    y: 435,
    status: 'Needs review',
    details: {
      pid: 'AC-001',
      role: 'Primary Originating Account Mandate',
      association: 'Associated with Rahul Sharma (owner_id: 1)',
      locations: ['Bhopal Central Financial Gateway'],
      aliases: ['AC-001 (Rahul Sharma)'],
      recentActivity: 'TXN_001 · 7 Aug 2026 09:00',
      confidence: '99.5%',
      metrics: '₹18,500 Outbound • ₹7,500 Return',
      description:
        'Initiated circular transfer TXN_001 (₹18,500 to AC-002) and received closed-loop return TXN_003 (₹7,500 from AC-003). Cited in FIR_010.',
      flagReason: 'Initiated circular transfer loop in FIN_001.',
      sourceDoc: 'FIR_010 & FIN_001 Core Banking Ledger',
      evidenceType: 'banking',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Account Owner (P-001)' },
        { name: 'Sehore Road Site', id: 'ent-loc-sehore', relation: 'Meeting Location' },
      ],
    },
  },
  {
    id: 'ent-loc-sehore',
    name: 'Sehore Road Site',
    subtitle: 'rendezvous spot',
    category: 'location',
    tier: 2,
    x: 320,
    y: 465,
    status: 'Resolved',
    details: {
      pid: 'LOC-SEHORE',
      role: 'Rendezvous Meeting Point',
      association: 'Cited in FIR_003',
      locations: ['Sehore Road roadside restaurant, Bhopal'],
      aliases: ['Sehore Highway Stop'],
      recentActivity: 'Sighting Record · 3 Aug 2026',
      confidence: '94.0%',
      metrics: 'Confirmed Meeting in FIR_003',
      description:
        'Location where Neeraj Khan and Rahul Sharma met to discuss transit operations.',
      sourceDoc: 'FIR_003 Police Case Docket',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'A/C 4567891201', id: 'ent-sbi-acct', relation: 'Linked Case Event' },
      ],
    },
  },

  // 5. Bottom-Left: Logistics Associate (Vikram Singh)
  {
    id: 'ent-vikram',
    name: 'Vikram Singh',
    subtitle: 'logistics associate',
    category: 'person',
    tier: 1,
    x: 250,
    y: 385,
    status: 'Resolved',
    details: {
      pid: 'P-005',
      role: 'Kolar Road Contact & Receiver',
      association: 'Bhopal Syndicate (Kolar Road Node)',
      locations: ['Kolar Road, Bhopal'],
      aliases: ['Vikram Singh', 'vikramsingh'],
      recentActivity: 'FIR_004 · 4 Aug 2026',
      confidence: '90.0%',
      metrics: 'Vehicle MP04GH3456 • Phone 9000010004',
      description:
        'Visited Kolar Road with Pooja Mehta (FIR_004). Target of calls during CDR_SPIKE_01. Account AC-005 received ₹9,100 in FIN_002 loop.',
      sourceDoc: 'FIR_004, FIN_002, CDR_SPIKE_01',
      evidenceType: 'vehicle',
      directLinks: [
        { name: 'Rahul Sharma', id: 'ent-rahul', relation: 'Spike Intercepts' },
        { name: 'Pooja Mehta', id: 'ent-pooja', relation: 'Kolar Road Companion' },
        { name: '9000010000', id: 'ent-phone-target', relation: 'Call Intercept' },
      ],
    },
  },
  {
    id: 'ent-pooja',
    name: 'Pooja Mehta',
    subtitle: 'phone contact',
    category: 'person',
    tier: 2,
    x: 105,
    y: 440,
    status: 'Resolved',
    details: {
      pid: 'P-006',
      role: 'Kolar Road Companion',
      association: 'Linked to Vikram Singh in FIR_004',
      locations: ['Kolar Road, Bhopal'],
      aliases: ['Pooja Mehta', 'poojamehta'],
      recentActivity: 'FIR_004 · 4 Aug 2026',
      confidence: '90.0%',
      metrics: 'Phone 9000010005',
      description:
        'Investigators recorded Vikram Singh and Pooja Mehta visiting Kolar Road together. Phone 9000010005 appears in source notes.',
      sourceDoc: 'FIR_004 Police Case Docket',
      evidenceType: 'call',
      directLinks: [
        { name: 'Vikram Singh', id: 'ent-vikram', relation: 'Traveled Together' },
      ],
    },
  },
  {
    id: 'ent-phone-target',
    name: '9000010000',
    subtitle: 'burst SIM',
    category: 'telecom',
    tier: 2,
    x: 95,
    y: 320,
    status: 'Needs review',
    details: {
      pid: 'PH-001',
      role: 'Rahul Sharma Mobile Line',
      association: 'Primary line cited in FIR_001, FIR_011 & CDR_SPIKE_01',
      locations: ['Bhopal Central BTS Tower-04'],
      aliases: ['PH-001'],
      recentActivity: 'Call Burst · 9 Aug 2026 11:24',
      confidence: '97.5%',
      metrics: '18 Burst Calls in 140 Minutes',
      description:
        'Registered to Rahul Sharma. Origin of 18 high-frequency call bursts contacting Amit Verma, Suresh Patel, Neeraj Khan, and Vikram Singh.',
      flagReason: '18 burst calls in 140 minutes on 09-Aug-2026 (CDR_SPIKE_01).',
      sourceDoc: 'CDR_SPIKE_01 Telecom Dump',
      evidenceType: 'call',
      directLinks: [
        { name: 'Vikram Singh', id: 'ent-vikram', relation: 'Intercepted Call' },
      ],
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  // Primary spokes radiating from Rahul Sharma (P-001)
  { id: 'e-rahul-amit', source: 'ent-rahul', target: 'ent-amit', label: 'Delivery Meeting', type: 'direct', evidence: 'FIR_001 planned delivery & CDR_SPIKE_01 calls' },
  { id: 'e-rahul-suresh', source: 'ent-rahul', target: 'ent-suresh', label: 'Circular Flow', type: 'financial', evidence: 'Circular return transfer ₹7,500 in FIN_001' },
  { id: 'e-rahul-neeraj', source: 'ent-rahul', target: 'ent-neeraj', label: 'Sehore Meeting', type: 'logistics', evidence: 'Met on Sehore Road (FIR_003) & call bursts' },
  { id: 'e-rahul-vikram', source: 'ent-rahul', target: 'ent-vikram', label: 'Spike Intercepts', type: 'telecom', evidence: 'Repeated calls during CDR_SPIKE_01 window' },
  { id: 'e-rahul-vehicle', source: 'ent-rahul', target: 'ent-vehicle-rahul', label: 'Uses Vehicle', type: 'logistics', evidence: 'Vehicle MP04AB1234 cited in FIR_001 & FIR_011' },
  { id: 'e-rahul-acct', source: 'ent-rahul', target: 'ent-sbi-acct', label: 'A/C 4567891201', type: 'financial', evidence: 'Account mandate AC-001 cited in FIR_010' },

  // Corroborated cross-link between Amit Verma & Suresh Patel (dashed line)
  { id: 'e-amit-suresh', source: 'ent-amit', target: 'ent-suresh', label: 'Habibganj Meet', dashed: true, type: 'logistics', evidence: 'Met near Habibganj station using MP04CD5678 (FIR_002)' },

  // Satellite evidence connections
  { id: 'e-amit-fir', source: 'ent-amit', target: 'ent-fir-001', label: 'FIR_001', dashed: true, type: 'legal', evidence: 'Named in FIR_001 docket for delivery discussion' },
  { id: 'e-amit-vehicle', source: 'ent-amit', target: 'ent-vehicle-amit', label: 'MP04CD5678', type: 'logistics', evidence: 'Vehicle used during Habibganj meeting (FIR_002)' },
  { id: 'e-suresh-acct', source: 'ent-suresh', target: 'ent-acct-suresh', label: 'A/C 4567891203', type: 'financial', evidence: 'Completed ₹7,500 return transfer to AC-001' },
  { id: 'e-neeraj-vehicle', source: 'ent-neeraj', target: 'ent-vehicle-neeraj', label: 'MP04EF9012', type: 'logistics', evidence: 'Vehicle logged at Sehore Road roadside restaurant' },
  { id: 'e-neeraj-acct', source: 'ent-neeraj', target: 'ent-acct-04', label: 'A/C 4567891204', dashed: true, type: 'financial', evidence: 'Secondary circular loop in FIN_002' },
  { id: 'e-acct-sehore', source: 'ent-sbi-acct', target: 'ent-loc-sehore', label: 'Sehore Hub', type: 'logistics', evidence: 'Co-located rendezvous site cited in FIR_003' },
  { id: 'e-vikram-pooja', source: 'ent-vikram', target: 'ent-pooja', label: 'Kolar Road', type: 'direct', evidence: 'Visited Kolar Road together (FIR_004)' },
  { id: 'e-vikram-phone', source: 'ent-vikram', target: 'ent-phone-target', label: '9000010000', dashed: true, type: 'telecom', evidence: 'Target of calls during CDR_SPIKE_01' },
];

const getCategoryIcon = (category: EntityCategory) => {
  switch (category) {
    case 'person':
      return <User className="w-4 h-4 text-slate-700" />;
    case 'organization':
      return <Building2 className="w-4 h-4 text-indigo-700" />;
    case 'telecom':
      return <Phone className="w-4 h-4 text-blue-700" />;
    case 'financial':
      return <Landmark className="w-4 h-4 text-amber-700" />;
    case 'vehicle':
      return <Truck className="w-4 h-4 text-emerald-700" />;
    case 'location':
      return <MapPin className="w-4 h-4 text-rose-700" />;
    case 'document':
      return <FileText className="w-4 h-4 text-purple-700" />;
    default:
      return <FileSearch className="w-4 h-4 text-slate-700" />;
  }
};

const getCategoryStyles = (category: EntityCategory) => {
  switch (category) {
    case 'person':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'organization':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'telecom':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'financial':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'vehicle':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'location':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'document':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const EditorialRelationshipView: React.FC<EditorialRelationshipViewProps> = ({
  onSelectEntity,
  selectedEntityId,
  onInvestigateEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core vs Full network scope: Default to 'core' to keep the sober, uncluttered layout by default
  const [viewScope, setViewScope] = useState<'core' | 'expanded'>('core');
  const [activeFilter, setActiveFilter] = useState<'All' | 'People' | 'Financial' | 'Field & Telecom'>('All');

  // Interactive state
  const [nodes, setNodes] = useState<RelationshipNode[]>(INITIAL_NODES);
  const [edges] = useState<Edge[]>(INITIAL_EDGES);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Inspection Drawer: start with Rahul Sharma selected by default so details are immediately visible
  const [inspectedNode, setInspectedNode] = useState<RelationshipNode | null>(() => {
    return INITIAL_NODES.find((n) => n.id === 'ent-rahul') || INITIAL_NODES.find((n) => n.id === 'ent-arjun') || INITIAL_NODES[0] || null;
  });
  const [inspectedEdge, setInspectedEdge] = useState<Edge | null>(null);

  // Auto-sync inspected node when selectedEntityId prop changes
  useEffect(() => {
    if (selectedEntityId) {
      const cleanTarget = selectedEntityId.replace('ent-', '').replace('-', '_');
      const match = nodes.find(
        (n) =>
          n.id === selectedEntityId ||
          n.id.replace('ent-', '').replace('-', '_') === cleanTarget ||
          n.id.replace('ent-', '') === selectedEntityId ||
          (cleanTarget === 'arjun' && n.id === 'ent-rahul')
      );
      if (match) {
        setInspectedNode(match);
        setInspectedEdge(null);
        if (match.tier === 2 && viewScope === 'core') {
          setViewScope('expanded');
        }
      }
    }
  }, [selectedEntityId, nodes]);

  const handleSelectConnectedNode = (nodeId: string) => {
    const match = nodes.find((n) => n.id === nodeId);
    if (match) {
      setInspectedEdge(null);
      setInspectedNode(match);
      if (match.tier === 2 && viewScope === 'core') {
        setViewScope('expanded');
      }
      if (onSelectEntity) {
        onSelectEntity(match.id);
      }
    }
  };

  // Evidence Modal trigger state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState<'call' | 'banking' | 'vehicle' | 'fir' | null>(null);

  // Visible nodes filtered by scope and category
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      // If core mode, show only tier 1 nodes (the 6 core suspects)
      if (viewScope === 'core' && node.tier === 2) return false;

      // Filter category
      if (activeFilter === 'People' && node.category !== 'person') return false;
      if (activeFilter === 'Financial' && node.category !== 'financial' && node.category !== 'organization') return false;
      if (activeFilter === 'Field & Telecom' && node.category !== 'telecom' && node.category !== 'vehicle' && node.category !== 'location' && node.category !== 'document') return false;

      return true;
    });
  }, [nodes, viewScope, activeFilter]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  // Visible edges
  const visibleEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  // Focus highlighting
  const activeFocus = useMemo(() => {
    const focusId = hoveredNodeId || selectedEntityId || inspectedNode?.id;
    if (!focusId) return null;

    const connectedNodeIds = new Set<string>([focusId]);
    const connectedEdgeIds = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === focusId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      } else if (edge.target === focusId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    });

    return { connectedNodeIds, connectedEdgeIds };
  }, [hoveredNodeId, selectedEntityId, inspectedNode, edges]);

  // Reset node positions to calibrated editorial drafting layout
  const handleResetLayout = () => {
    setNodes(INITIAL_NODES);
    setZoomLevel(1);
  };

  // Drag handlers
  const handleMouseDown = (node: RelationshipNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const scaleX = 960 / rect.width;
      const scaleY = 540 / rect.height;
      const svgX = clientX * scaleX;
      const svgY = clientY * scaleY;
      setDragOffset({ x: svgX - node.x, y: svgY - node.y });
    }

    if (onSelectEntity) {
      onSelectEntity(node.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const scaleX = 960 / rect.width;
    const scaleY = 540 / rect.height;
    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.max(50, Math.min(910, svgX - dragOffset.x)),
            y: Math.max(45, Math.min(495, svgY - dragOffset.y)),
          };
        }
        return n;
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleNodeClick = (node: RelationshipNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectedEdge(null);
    setInspectedNode(node);
    if (onSelectEntity) {
      onSelectEntity(node.id);
    }
  };

  const handleEdgeClick = (edge: Edge, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectedNode(null);
    setInspectedEdge(edge);
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs overflow-hidden flex flex-col h-full relative">
      {/* 1. Header with Title & Clean Editorial Controls */}
      <div className="px-5 py-3 border-b border-[#ece8df] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Relationship view</span>
            <span className="text-[11px] font-medium text-slate-400">
              ({visibleNodes.length} entities • {visibleEdges.length} links)
            </span>
          </h3>
        </div>

        {/* View Controls & Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Toggle */}
          <div className="flex items-center bg-[#f6f4ef] p-0.5 rounded-md border border-[#e5e0d8] text-xs">
            <button
              type="button"
              onClick={() => setViewScope('core')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                viewScope === 'core'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Core Ring (6)
            </button>
            <button
              type="button"
              onClick={() => setViewScope('expanded')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                viewScope === 'expanded'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Full Network (15)
            </button>
          </div>

          {/* Quick Category Filter */}
          <div className="hidden sm:flex items-center gap-1">
            {(['All', 'People', 'Financial', 'Field & Telecom'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-[#1c252e] text-white shadow-2xs'
                    : 'text-slate-500 hover:bg-[#f6f4ef] hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#e5e0d8] hidden sm:block" />

          {/* Zoom & Reset Toolbar */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              title="Zoom In"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              title="Zoom Out"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetLayout}
              title="Reset layout & zoom"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Drafting Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[460px] lg:min-h-[500px] bg-white overflow-hidden select-none cursor-default"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="w-full h-full transition-transform duration-100 ease-out"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          viewBox="0 0 960 540"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Crisp engineering square grid (32px) */}
            <pattern
              id="editorialSquareGrid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#eeeae3"
                strokeWidth="0.8"
              />
            </pattern>

            {/* Subtle soft node shadow */}
            <filter id="softNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#1e262f" floodOpacity="0.08" />
            </filter>

            {/* Glowing highlight for active selection */}
            <filter id="glowHighlight" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#b8533c" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Canvas */}
          <rect width="100%" height="100%" fill="#ffffff" />
          <rect width="100%" height="100%" fill="url(#editorialSquareGrid)" />

          {/* Faint Forensic Quadrant Guidelines */}
          <g className="pointer-events-none opacity-35">
            {/* Concentric circles centered on Arjun Rathore */}
            <circle cx="480" cy="270" r="140" fill="none" stroke="#e0dbd1" strokeWidth="0.8" strokeDasharray="3 4" />
            <circle cx="480" cy="270" r="235" fill="none" stroke="#e8e4dc" strokeWidth="0.8" strokeDasharray="2 6" />

            {/* Subtle quadrant labels in corners */}
            <text x="60" y="42" fill="#a09a8e" fontSize="9" fontWeight="600" letterSpacing="0.1em">
              SEC-A // LEGAL & CORPORATE
            </text>
            <text x="740" y="42" fill="#a09a8e" fontSize="9" fontWeight="600" letterSpacing="0.1em">
              SEC-B // TELECOM & SURVEILLANCE
            </text>
            <text x="740" y="520" fill="#a09a8e" fontSize="9" fontWeight="600" letterSpacing="0.1em">
              SEC-C // HAWALA & FINANCIAL
            </text>
            <text x="60" y="520" fill="#a09a8e" fontSize="9" fontWeight="600" letterSpacing="0.1em">
              SEC-D // LOGISTICS & ANPR
            </text>
          </g>

          {/* Connection Lines & Labels */}
          {visibleEdges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isFocused = activeFocus && activeFocus.connectedEdgeIds.has(edge.id);
            const isHovered = hoveredEdgeId === edge.id;
            const isDimmed = activeFocus && !isFocused;

            // Line styling
            const strokeColor = isHovered || isFocused ? '#b8533c' : '#b2bac4';
            const strokeWidth = isHovered || isFocused ? 2.2 : 1.3;

            // Midpoint coordinates
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g
                key={edge.id}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onClick={(e) => handleEdgeClick(edge, e)}
              >
                {/* Invisible wide hit-box for comfortable clicking */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Visible Relationship Line */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.dashed ? '4 4' : 'none'}
                  opacity={isDimmed ? 0.25 : 1}
                  className="transition-all duration-150"
                />

                {/* Midpoint Label Badge */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  className="transition-opacity duration-150"
                  opacity={isDimmed ? 0.2 : 1}
                >
                  <rect
                    x="-34"
                    y="-9"
                    width="68"
                    height="18"
                    rx="9"
                    fill={isHovered || isFocused ? '#1c252e' : '#ffffff'}
                    stroke={isHovered || isFocused ? '#1c252e' : '#d5cfc5'}
                    strokeWidth="0.9"
                    filter="url(#softNodeShadow)"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isHovered || isFocused ? '#ffffff' : '#576574'}
                    fontSize="8.5"
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {visibleNodes.map((node) => {
            const isCenter = node.isCenter;
            const isSelected = selectedEntityId === node.id || inspectedNode?.id === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isDimmed = activeFocus && !activeFocus.connectedNodeIds.has(node.id);

            const opacity = isDimmed ? 0.35 : 1;

            if (isCenter) {
              // Center Terracotta / Rust Card matching reference screenshot
              const cardWidth = 132;
              const cardHeight = 44;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-grab active:cursor-grabbing group"
                  opacity={opacity}
                  onMouseDown={(e) => handleMouseDown(node, e)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => handleNodeClick(node, e)}
                >
                  {/* Subtle Pulse Ring */}
                  <rect
                    x={-cardWidth / 2 - 4}
                    y={-cardHeight / 2 - 4}
                    width={cardWidth + 8}
                    height={cardHeight + 8}
                    rx="6"
                    fill="none"
                    stroke="#b8533c"
                    strokeWidth="1"
                    opacity="0.25"
                    className="animate-pulse"
                  />

                  {/* Center Card */}
                  <rect
                    x={-cardWidth / 2}
                    y={-cardHeight / 2}
                    width={cardWidth}
                    height={cardHeight}
                    rx="4"
                    fill="#b8533c"
                    stroke="#9e412c"
                    strokeWidth="1.2"
                    filter={isSelected ? 'url(#glowHighlight)' : 'url(#softNodeShadow)'}
                    className="transition-transform duration-75 group-hover:brightness-105"
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12.5"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.name}
                  </text>
                  <text
                    x="0"
                    y="11.5"
                    textAnchor="middle"
                    fill="#fce1d9"
                    fontSize="9.5"
                    fontWeight="500"
                    letterSpacing="0.04em"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.subtitle}
                  </text>
                </g>
              );
            }

            // Outer Nodes: Tier 1 (Core Suspects) vs Tier 2 (Satellite Evidence)
            const isTier1 = node.tier === 1;
            const labelWidth = isTier1
              ? Math.max(140, node.name.length * 7.2 + 32)
              : Math.max(110, node.name.length * 6.5 + 24);
            const labelHeight = isTier1 ? 38 : 30;

            const isNeedsReview = node.status === 'Needs review';
            const statusDotColor = isNeedsReview ? '#b44c35' : '#2e7d4f';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-grab active:cursor-grabbing group"
                opacity={opacity}
                onMouseDown={(e) => handleMouseDown(node, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => handleNodeClick(node, e)}
              >
                {/* Node Box */}
                <rect
                  x={-labelWidth / 2}
                  y={-labelHeight / 2}
                  width={labelWidth}
                  height={labelHeight}
                  rx="4"
                  fill="#ffffff"
                  stroke={isSelected ? '#b8533c' : isTier1 ? '#c8c2b7' : '#dedad2'}
                  strokeWidth={isSelected ? '2' : isTier1 ? '1.2' : '1'}
                  filter="url(#softNodeShadow)"
                  className="transition-colors duration-100 group-hover:stroke-slate-500"
                />

                {/* Status Indicator Dot on Left */}
                <circle
                  cx={-labelWidth / 2 + 12}
                  cy={isTier1 ? -4 : 0}
                  r="3.2"
                  fill={statusDotColor}
                  className="pointer-events-none"
                />

                {/* Primary Entity Name */}
                <text
                  x={-labelWidth / 2 + 22}
                  y={isTier1 ? 0 : 3.5}
                  textAnchor="start"
                  fill="#1e262f"
                  fontSize={isTier1 ? '11.5' : '10'}
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  className="pointer-events-none select-none"
                >
                  {node.name}
                </text>

                {/* Subtitle (e.g. phone interaction, call record, account transfer) */}
                {isTier1 && node.subtitle && (
                  <text
                    x={-labelWidth / 2 + 22}
                    y="11"
                    textAnchor="start"
                    fill="#758291"
                    fontSize="9"
                    fontWeight="400"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.subtitle}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Node Inspection Card / Drawer */}
        {inspectedNode && (
          <div
            id="relationship-entity-details-drawer"
            className="absolute top-3 right-3 bottom-3 z-20 w-84 sm:w-96 max-h-[calc(100%-24px)] overflow-y-auto bg-white/98 backdrop-blur-md border border-[#e5e0d8] rounded-xl shadow-2xl p-4 flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: Icon, Name, PID, Status, Close */}
            <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#ece8df]">
              <div className="flex items-start gap-2.5 min-w-0 flex-1 mr-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getCategoryStyles(
                    inspectedNode.category
                  )}`}
                >
                  {getCategoryIcon(inspectedNode.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                      {inspectedNode.name}
                    </h4>
                    {inspectedNode.details.pid && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {inspectedNode.details.pid}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        inspectedNode.status === 'Needs review'
                          ? 'bg-[#fcf0ed] text-[#b44c35] border-[#f4dad2]'
                          : 'bg-[#eef6f0] text-[#2d6a4f] border-[#d5ecdc]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {inspectedNode.status}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      {inspectedNode.details.confidence} Match
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedNode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* What they do & Role */}
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                What they do (Role)
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {inspectedNode.details.role}
              </p>
            </div>

            {/* Simple Summary */}
            <div className="p-3 bg-[#faf8f4] border border-[#ece8df] rounded-lg mb-3 text-xs leading-relaxed text-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Summary
              </span>
              <p className="text-[11.5px] leading-relaxed text-slate-700">
                {inspectedNode.details.description}
              </p>
            </div>

            {/* Simple Key Details Table */}
            <div className="p-3 bg-[#fdfcfb] border border-[#ece8df] rounded-lg text-xs space-y-2 mb-3">
              {inspectedNode.details.association && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-medium text-[11px] shrink-0">Syndicate Link:</span>
                  <span className="text-slate-800 font-semibold text-[11px] text-right">
                    {inspectedNode.details.association}
                  </span>
                </div>
              )}

              {inspectedNode.details.locations && inspectedNode.details.locations.length > 0 && (
                <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                  <span className="text-slate-400 font-medium text-[11px] shrink-0">Location:</span>
                  <span className="text-slate-700 font-medium text-[11px] text-right">
                    {inspectedNode.details.locations.join(' • ')}
                  </span>
                </div>
              )}

              {inspectedNode.details.aliases && inspectedNode.details.aliases.length > 0 && (
                <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                  <span className="text-slate-400 font-medium text-[11px] shrink-0">Other Names / Phone:</span>
                  <span className="text-slate-700 font-mono text-[11px] text-right">
                    {inspectedNode.details.aliases.join(', ')}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                <span className="text-slate-400 font-medium text-[11px] shrink-0">Key Numbers:</span>
                <span className="text-slate-900 font-bold text-[11px] text-right">
                  {inspectedNode.details.metrics}
                </span>
              </div>

              {inspectedNode.details.sourceDoc && (
                <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                  <span className="text-slate-400 font-medium text-[11px] shrink-0">Proof / Source:</span>
                  <span className="text-slate-700 font-medium text-[11px] text-right truncate max-w-[200px]">
                    {inspectedNode.details.sourceDoc}
                  </span>
                </div>
              )}

              {inspectedNode.details.recentActivity && (
                <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                  <span className="text-slate-400 font-medium text-[11px] shrink-0">Latest Activity:</span>
                  <span className="text-slate-600 font-mono text-[10.5px] text-right">
                    {inspectedNode.details.recentActivity}
                  </span>
                </div>
              )}
            </div>

            {/* Direct Connected Entities (Clickable navigation chips) */}
            {inspectedNode.details.directLinks && inspectedNode.details.directLinks.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Connected People &amp; Links ({inspectedNode.details.directLinks.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedNode.details.directLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => handleSelectConnectedNode(link.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#f6f4ef] text-slate-800 text-[11px] font-medium rounded-md border border-[#e5e0d8] hover:border-[#b8533c]/40 transition-colors cursor-pointer group"
                    >
                      <span className="font-semibold text-slate-900 group-hover:text-[#b8533c]">
                        {link.name}
                      </span>
                      <span className="text-[10px] text-slate-400">({link.relation})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Review Notice Banner (If flagged) */}
            {inspectedNode.details.flagReason && (
              <div className="p-2.5 bg-[#fcf0ed] border border-[#f4dad2] rounded-lg text-[11px] text-[#b44c35] leading-snug mb-3 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#b44c35]" />
                <div>
                  <strong className="font-bold">Why Flagged:</strong> {inspectedNode.details.flagReason}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mt-auto pt-2 border-t border-[#f0ede6]">
              {/* Evidence Modal Triggers */}
              {inspectedNode.details.evidenceType === 'call' && (
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen('call')}
                  className="w-full py-2 px-3 bg-[#f0f7ff] hover:bg-[#e0efff] text-blue-800 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Phone Call Records (Calls &amp; SIM)</span>
                </button>
              )}

              {inspectedNode.details.evidenceType === 'banking' && (
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen('banking')}
                  className="w-full py-2 px-3 bg-[#fbf5ee] hover:bg-[#f6ebdc] text-amber-900 text-xs font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Landmark className="w-3.5 h-3.5 text-amber-700" />
                  <span>View Bank Transactions &amp; Accounts</span>
                </button>
              )}

              {inspectedNode.details.evidenceType === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen('vehicle')}
                  className="w-full py-2 px-3 bg-[#eef8f2] hover:bg-[#dcf2e4] text-emerald-900 text-xs font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>View Vehicle Movement &amp; Toll Records</span>
                </button>
              )}

              {inspectedNode.details.evidenceType === 'fir' && (
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen('fir')}
                  className="w-full py-2 px-3 bg-[#f7f3fb] hover:bg-[#efe6fa] text-purple-900 text-xs font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                  <span>View Police Case Report (FIR_102)</span>
                </button>
              )}

              {/* Investigate Suspect Dossier in Chat */}
              {onInvestigateEntity && (
                <button
                  type="button"
                  onClick={() => {
                    const mappedId = inspectedNode.id.replace('ent-', '').replace('-', '_');
                    onInvestigateEntity(mappedId);
                  }}
                  className="w-full py-2 px-3 bg-[#a94e2c] hover:bg-[#8a3e21] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Ask AI Assistant about this person →</span>
                </button>
              )}

              {/* Status Toggle & Close */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === inspectedNode.id
                          ? { ...n, status: n.status === 'Needs review' ? 'Resolved' : 'Needs review' }
                          : n
                      )
                    );
                    setInspectedNode((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: prev.status === 'Needs review' ? 'Resolved' : 'Needs review',
                          }
                        : null
                    );
                  }}
                  className="flex-1 py-1.5 px-3 bg-[#1c252e] hover:bg-[#283543] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer text-center shadow-2xs"
                >
                  {inspectedNode.status === 'Needs review' ? 'Mark Resolved' : 'Flag for Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedNode(null)}
                  className="py-1.5 px-3 bg-[#f6f4ef] hover:bg-[#eae6de] text-slate-700 text-xs font-semibold rounded-md border border-[#e5e0d8] transition-colors cursor-pointer text-center"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edge / Link Detail Card */}
        {inspectedEdge && (
          <div className="absolute top-3 right-3 z-20 w-80 bg-white/98 backdrop-blur-xs border border-[#e5e0d8] rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between pb-2 mb-2 border-b border-[#f0ede6]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#b8533c]">
                  Relationship Link
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  {nodes.find((n) => n.id === inspectedEdge.source)?.name} ↔{' '}
                  {nodes.find((n) => n.id === inspectedEdge.target)?.name}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setInspectedEdge(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection:</span>
                <span className="font-semibold text-slate-800">{inspectedEdge.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Link Type:</span>
                <span className="font-medium text-slate-700">
                  {inspectedEdge.dashed ? 'Connected Link' : 'Direct Link'}
                </span>
              </div>
              <div className="p-2.5 bg-[#fbfaf8] border border-[#ece8df] rounded-lg text-slate-600">
                <p className="text-[11px] leading-relaxed">
                  <strong>Proof / Record:</strong> {inspectedEdge.evidence || 'Verified through cross-matched case records.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedEdge(null)}
              className="w-full mt-3 py-1.5 px-3 bg-[#f6f4ef] hover:bg-[#eae6de] text-slate-700 text-xs font-semibold rounded-md border border-[#e5e0d8] transition-colors cursor-pointer text-center"
            >
              Close Link Detail
            </button>
          </div>
        )}
      </div>

      {/* 3. Footer with Visual Legend & Analytics */}
      <div className="px-5 py-3 border-t border-[#ece8df] bg-[#ffffff] flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-semibold text-slate-800">
            18 connections mapped across Bhopal network
          </span>
          <span className="hidden sm:inline-block text-slate-300">•</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#b44c35]" />
            Needs review (6)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#2e7d4f]" />
            Resolved (6)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="hidden md:inline">Drag any node to reposition</span>
          <span>Click any line or card to inspect</span>
        </div>
      </div>

      {/* Forensic Evidence Modals */}
      <CallRecordsModal
        isOpen={evidenceModalOpen === 'call'}
        onClose={() => setEvidenceModalOpen(null)}
        entityName={inspectedNode?.name || 'Rahul Sharma'}
      />
      <BankingLedgerModal
        isOpen={evidenceModalOpen === 'banking'}
        onClose={() => setEvidenceModalOpen(null)}
        entityName={inspectedNode?.name || 'Rahul Sharma'}
      />
      <VehicleLogsModal
        isOpen={evidenceModalOpen === 'vehicle'}
        onClose={() => setEvidenceModalOpen(null)}
        entityName={inspectedNode?.name || 'Rahul Sharma'}
      />
      <FirDocumentModal
        isOpen={evidenceModalOpen === 'fir'}
        onClose={() => setEvidenceModalOpen(null)}
        entityName={inspectedNode?.name || 'FIR_001 Docket'}
      />
    </div>
  );
};
