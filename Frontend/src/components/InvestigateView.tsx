import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  ArrowLeft,
  Sparkles,
  Send,
  User,
  Building2,
  Phone,
  Landmark,
  Car,
  FileText,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { BankingLedgerModal } from './BankingLedgerModal';
import { CallRecordsModal } from './CallRecordsModal';
import { VehicleLogsModal } from './VehicleLogsModal';
import { FirDocumentModal } from './FirDocumentModal';
import { WhyFlaggedModal } from './WhyFlaggedModal';
import { Entity } from '../types';

export interface ForensicEntity {
  id: string;
  name: string;
  initials: string;
  type: string;
  category: 'person' | 'organization' | 'financial' | 'vehicle' | 'document';
  pid: string;
  status: 'Needs review' | 'Resolved';
  role: string;
  aliases: string[];
  association: string;
  locations: string[];
  peopleCount: number;
  orgsCount: number;
  recentRecord: string;
  flagged: boolean;
  confidence: number;
  centrality: 'High' | 'Medium' | 'Low';
  sourcesCount: number;
  summary: string;
  evidence: Array<{ src: 'FIR' | 'CDR' | 'FIN' | 'LOC'; rec: string; rel: string }>;
  alerts: Array<{ t: string; s: string; sev: 'High' | 'Medium' | 'Low' }>;
  links: string[];
}

export const ENTITY_DATABASE: Record<string, ForensicEntity> = {
  rahul: {
    id: 'rahul',
    name: 'Rahul Sharma',
    initials: 'RS',
    type: 'Person of interest',
    category: 'person',
    pid: 'P-001',
    status: 'Needs review',
    role: 'Central Bridge & Coordination',
    aliases: ['Rahul K Sharma', 'R. Sharma', 'rahulsharma'],
    association: 'Account 4567891201 (AC-001) & Scorpio MP04AB1234',
    locations: ['Bhopal Central', 'New Market', 'Sehore Road'],
    peopleCount: 6,
    orgsCount: 2,
    recentRecord: 'CDR_SPIKE_01 · 9 Aug 2026',
    flagged: true,
    confidence: 0.96,
    centrality: 'High',
    sourcesCount: 4,
    summary:
      'Primary bridge entity connecting delivery coordination in New Market (FIR_001), 18 burst calls in 140 min (CDR_SPIKE_01), and a circular financial loop returning ₹7,500 (FIN_001).',
    evidence: [
      { src: 'FIR', rec: 'FIR_001', rel: 'Met Amit Verma near New Market; planned delivery' },
      { src: 'CDR', rec: 'CDR_SPIKE_01', rel: '18 burst calls in 140 mins across 4 associates' },
      { src: 'FIN', rec: 'FIN_001', rel: 'Sent ₹18,500 to AC-002; received ₹7,500 return from AC-003' },
      { src: 'LOC', rec: 'ANPR_001', rel: 'Vehicle MP04AB1234 sighted in New Market' },
    ],
    alerts: [
      { t: 'Communication spike across 4 contacts', s: '18 calls in 140 mins · Rule CDR-01', sev: 'High' },
      { t: 'Closed circular financial transfer loop', s: '₹18.5k sent, ₹7.5k returned · Rule FIN-01', sev: 'High' },
      { t: 'Multiple identity aliases resolved', s: 'Rahul K Sharma & R. Sharma · Rule RES-01', sev: 'Medium' },
    ],
    links: ['amit', 'suresh', 'neeraj', 'vikram', 'acct_001'],
  },
  amit: {
    id: 'amit',
    name: 'Amit Verma',
    initials: 'AV',
    type: 'Operating Associate',
    category: 'person',
    pid: 'P-002',
    status: 'Needs review',
    role: 'Delivery planning · New Market & Habibganj',
    aliases: ['amitverma'],
    association: 'Account 4567891202 (AC-002) & Vehicle MP04CD5678',
    locations: ['New Market', 'Habibganj Station, Bhopal'],
    peopleCount: 3,
    orgsCount: 1,
    recentRecord: 'FIR_002 · 2 Aug 2026',
    flagged: true,
    confidence: 0.92,
    centrality: 'High',
    sourcesCount: 3,
    summary:
      'Key operating associate of Rahul Sharma. Coordinated delivery planning in New Market (FIR_001) and transferred ₹12,000 to Suresh Patel after receiving funds from Rahul (FIN_001).',
    evidence: [
      { src: 'FIR', rec: 'FIR_001', rel: 'Met Rahul K Sharma near New Market' },
      { src: 'FIR', rec: 'FIR_002', rel: 'Met Suresh Patel near Habibganj station' },
      { src: 'FIN', rec: 'FIN_001', rel: 'Received ₹18,500 from AC-001; sent ₹12,000 to AC-003' },
    ],
    alerts: [
      { t: 'Transit fund routing', s: '₹12,000 forwarded to Suresh Patel · Rule FIN-01', sev: 'High' },
      { t: 'Burst call recipient', s: 'Targeted in 18-call spike on 09-Aug · Rule CDR-01', sev: 'High' },
    ],
    links: ['rahul', 'suresh'],
  },
  suresh: {
    id: 'suresh',
    name: 'Suresh Patel',
    initials: 'SP',
    type: 'Circular Mule & Contact',
    category: 'person',
    pid: 'P-003',
    status: 'Needs review',
    role: 'Circular transfer mule · Return ₹7,500',
    aliases: ['sureshpatel'],
    association: 'Account 4567891203 (AC-003)',
    locations: ['Habibganj Station, Bhopal'],
    peopleCount: 2,
    orgsCount: 1,
    recentRecord: 'FIN_001 · 7 Aug 2026',
    flagged: true,
    confidence: 0.94,
    centrality: 'High',
    sourcesCount: 3,
    summary:
      'Closed the circular transfer loop in FIN_001: received ₹12,000 from Amit Verma and returned ₹7,500 to Rahul Sharma on 07-Aug-2026.',
    evidence: [
      { src: 'FIR', rec: 'FIR_002', rel: 'Met Amit Verma near Habibganj station' },
      { src: 'FIN', rec: 'FIN_001', rel: 'Received ₹12,000 from AC-002; sent ₹7,500 to AC-001' },
      { src: 'CDR', rec: 'CDR_SPIKE_01', rel: 'Phone interaction with Rahul Sharma' },
    ],
    alerts: [
      { t: 'Loop completion transfer', s: 'Returned ₹7,500 to originating account AC-001', sev: 'High' },
    ],
    links: ['amit', 'rahul'],
  },
  neeraj: {
    id: 'neeraj',
    name: 'Neeraj Khan',
    initials: 'NK',
    type: 'Regional Transporter',
    category: 'person',
    pid: 'P-004',
    status: 'Needs review',
    role: 'Sehore Road courier & associate',
    aliases: ['N. Khan', 'neerajkhan'],
    association: 'Account 4567891204 (AC-004) & Van MP04EF9012',
    locations: ['Sehore Road', 'Bhopal Outer'],
    peopleCount: 2,
    orgsCount: 1,
    recentRecord: 'FIR_003 · 3 Aug 2026',
    flagged: true,
    confidence: 0.89,
    centrality: 'Medium',
    sourcesCount: 3,
    summary:
      'Regional transporter. Met Rahul Sharma on Sehore Road to exchange parcel (FIR_003) and transacted ₹9,000 with Vikram Singh (FIN_002).',
    evidence: [
      { src: 'FIR', rec: 'FIR_003', rel: 'Met Rahul Sharma on Sehore Road' },
      { src: 'FIN', rec: 'FIN_002', rel: 'Transferred ₹9,000 to AC-005 (Vikram Singh)' },
      { src: 'CDR', rec: 'CDR_SPIKE_01', rel: 'Contacted during burst window' },
    ],
    alerts: [
      { t: 'Secondary transfer funnel', s: '₹9,000 forwarded to Vikram Singh · Rule FIN-02', sev: 'Medium' },
    ],
    links: ['rahul', 'vikram'],
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram Singh',
    initials: 'VS',
    type: 'Logistics Associate',
    category: 'person',
    pid: 'P-005',
    status: 'Resolved',
    role: 'Kolar Road transit & receiver',
    aliases: ['vikramsingh'],
    association: 'Account 4567891205 (AC-005) & Car MP04GH3456',
    locations: ['Kolar Road, Bhopal'],
    peopleCount: 2,
    orgsCount: 1,
    recentRecord: 'FIR_004 · 4 Aug 2026',
    flagged: false,
    confidence: 0.85,
    centrality: 'Medium',
    sourcesCount: 2,
    summary:
      'Visited Kolar Road with Pooja Mehta in vehicle MP04GH3456 (FIR_004). Received funds in AC-005.',
    evidence: [
      { src: 'FIR', rec: 'FIR_004', rel: 'Kolar Road sighting with Pooja Mehta' },
      { src: 'FIN', rec: 'FIN_002', rel: 'Received ₹9,000 from AC-004' },
    ],
    alerts: [],
    links: ['neeraj', 'pooja'],
  },
  pooja: {
    id: 'pooja',
    name: 'Pooja Mehta',
    initials: 'PM',
    type: 'Field Companion',
    category: 'person',
    pid: 'P-006',
    status: 'Resolved',
    role: 'Kolar Road travel companion',
    aliases: ['poojamehta'],
    association: 'Vikram Singh contact',
    locations: ['Kolar Road, Bhopal'],
    peopleCount: 1,
    orgsCount: 0,
    recentRecord: 'FIR_004 · 4 Aug 2026',
    flagged: false,
    confidence: 0.78,
    centrality: 'Low',
    sourcesCount: 1,
    summary:
      'Observed traveling with Vikram Singh on Kolar Road (FIR_004). Phone interaction on 9000010005.',
    evidence: [{ src: 'FIR', rec: 'FIR_004', rel: 'Sighted with Vikram Singh on Kolar Road' }],
    alerts: [],
    links: ['vikram'],
  },
  manish: {
    id: 'manish',
    name: 'Manish Gupta',
    initials: 'MG',
    type: 'Misrod Contact',
    category: 'person',
    pid: 'P-012',
    status: 'Resolved',
    role: 'Misrod hub coordination',
    aliases: ['M. Gupta', 'manishgupta'],
    association: 'Account 4567891208 (AC-008) & Van MP04NP6789',
    locations: ['Misrod, Bhopal'],
    peopleCount: 2,
    orgsCount: 1,
    recentRecord: 'FIR_011 · 11 Aug 2026',
    flagged: false,
    confidence: 0.88,
    centrality: 'Medium',
    sourcesCount: 2,
    summary:
      'Correlated with Farhan Ali in MP Nagar. Met on Hoshangabad road near Misrod.',
    evidence: [
      { src: 'FIR', rec: 'FIR_011', rel: 'Misrod field meeting' },
      { src: 'FIR', rec: 'FIR_012', rel: 'MP Nagar correlation' },
    ],
    alerts: [],
    links: ['farhan'],
  },
  farhan: {
    id: 'farhan',
    name: 'Farhan Ali',
    initials: 'FA',
    type: 'Correlated Contact',
    category: 'person',
    pid: 'P-015',
    status: 'Resolved',
    role: 'MP Nagar associate',
    aliases: ['F. Ali', 'farhanali'],
    association: 'Account 4567891209 (AC-009)',
    locations: ['MP Nagar, Bhopal'],
    peopleCount: 1,
    orgsCount: 0,
    recentRecord: 'FIR_012 · 12 Aug 2026',
    flagged: false,
    confidence: 0.82,
    centrality: 'Low',
    sourcesCount: 1,
    summary:
      'Correlated with Manish Gupta in MP Nagar. Phone registered on 9000010014.',
    evidence: [{ src: 'FIR', rec: 'FIR_012', rel: 'MP Nagar correlation record' }],
    alerts: [],
    links: ['manish'],
  },
  acct_001: {
    id: 'acct_001',
    name: 'A/C 4567891201',
    initials: 'AC',
    type: 'Primary Syndicate Account',
    category: 'financial',
    pid: 'AC-001',
    status: 'Needs review',
    role: 'Originating & receiving conduit',
    aliases: ['AC-001 Bhopal Central'],
    association: 'Rahul Sharma (mandate holder)',
    locations: ['Bhopal Central'],
    peopleCount: 2,
    orgsCount: 0,
    recentRecord: 'FIN_001 · 7 Aug 2026',
    flagged: true,
    confidence: 0.98,
    centrality: 'High',
    sourcesCount: 2,
    summary:
      'Originating and receiving account in circular transfer loop FIN_001: sent ₹18,500 to AC-002, received ₹7,500 return from AC-003.',
    evidence: [{ src: 'FIN', rec: 'FIN_001', rel: 'Circular fund routing conduit' }],
    alerts: [
      { t: 'Closed circular transfer loop', s: '₹18.5k sent, ₹7.5k returned · Rule FIN-01', sev: 'High' },
    ],
    links: ['rahul', 'amit', 'suresh'],
  },
};

// Aliases for backwards compatibility
ENTITY_DATABASE['arjun'] = ENTITY_DATABASE['rahul'];
ENTITY_DATABASE['sbi_acct'] = ENTITY_DATABASE['acct_001'];
ENTITY_DATABASE['rohan'] = ENTITY_DATABASE['amit'];
ENTITY_DATABASE['sameer'] = ENTITY_DATABASE['neeraj'];
ENTITY_DATABASE['priya'] = ENTITY_DATABASE['pooja'];
ENTITY_DATABASE['meera'] = ENTITY_DATABASE['manish'];
ENTITY_DATABASE['rathore_transport'] = ENTITY_DATABASE['acct_001'];

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  entity?: ForensicEntity;
  citations?: Array<{ label: string; doc: string }>;
  suggestedFollowups?: [string, string] | [string];
}

interface InvestigateViewProps {
  selectedEntityId?: string;
  onSelectEntity?: (id: string) => void;
  onBackToOverview?: () => void;
  onOpenBankingModal?: () => void;
  onOpenCallModal?: () => void;
  onOpenVehicleModal?: () => void;
  onOpenWhyFlaggedModal?: () => void;
  onOpenFirModal?: (firId?: string) => void;
}

const GHOST_SUGGESTIONS = [
  'Investigate Rahul Sharma',
  "What is Suresh Patel's connection to the ₹7,500 return transfer?",
  'Trace the 18 burst calls from Rahul Sharma (9000010000)',
  'Explain the FIN_001 circular transaction loop',
  'Who is Amit Verma and why was his delivery meeting flagged?',
  'Show accounts linked to AC-001 (4567891201)',
];

export const InvestigateView: React.FC<InvestigateViewProps> = ({
  selectedEntityId = 'rahul',
  onSelectEntity,
  onBackToOverview,
  onOpenBankingModal,
  onOpenCallModal,
  onOpenVehicleModal,
  onOpenWhyFlaggedModal,
  onOpenFirModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<
    'banking' | 'call' | 'vehicle' | 'fir' | 'whyFlagged' | null
  >(null);
  const [modalEntity, setModalEntity] = useState<ForensicEntity>(
    ENTITY_DATABASE[selectedEntityId] || ENTITY_DATABASE['rahul'] || ENTITY_DATABASE['arjun']
  );

  // Initial conversation is empty - clean plain screen with no pre-opened entity
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Cycle faded placeholder ghost suggestion every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % GHOST_SUGGESTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const currentGhostSuggestion = GHOST_SUGGESTIONS[suggestionIndex];

  // Natural Language Investigation Query Resolution
  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || inputText).trim();
    if (!query || isThinking) return;

    // Append user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    const qLower = query.toLowerCase();

    // Determine targeted entity if any
    let matchedEntity: ForensicEntity | undefined;
    if (qLower.includes('rahul') || qLower.includes('arjun') || qLower.includes('sharma')) {
      matchedEntity = ENTITY_DATABASE['rahul'];
    } else if (qLower.includes('amit') || qLower.includes('verma')) {
      matchedEntity = ENTITY_DATABASE['amit'];
    } else if (qLower.includes('suresh') || qLower.includes('patel')) {
      matchedEntity = ENTITY_DATABASE['suresh'];
    } else if (qLower.includes('neeraj') || qLower.includes('sehore')) {
      matchedEntity = ENTITY_DATABASE['neeraj'];
    } else if (qLower.includes('vikram') || qLower.includes('singh') || qLower.includes('kolar')) {
      matchedEntity = ENTITY_DATABASE['vikram'];
    } else if (qLower.includes('pooja') || qLower.includes('mehta')) {
      matchedEntity = ENTITY_DATABASE['pooja'];
    } else if (qLower.includes('manish') || qLower.includes('misrod')) {
      matchedEntity = ENTITY_DATABASE['manish'];
    } else if (qLower.includes('farhan') || qLower.includes('nagar')) {
      matchedEntity = ENTITY_DATABASE['farhan'];
    } else if (qLower.includes('ac-001') || qLower.includes('4567891201') || qLower.includes('sbi') || qLower.includes('bank') || qLower.includes('circular')) {
      matchedEntity = ENTITY_DATABASE['acct_001'];
    }

    if (matchedEntity) {
      setModalEntity(matchedEntity);
      if (onSelectEntity) {
        onSelectEntity(matchedEntity.id);
      }
    }
  const nowLabel = () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const replyText = await api.sendChatMessage(query);

      const followups: [string, string] = matchedEntity
        ? [
            `Show all evidence records for ${matchedEntity.name}`,
            `Trace connections linked to ${matchedEntity.name}`,
          ]
        : ['Who are the key bridge entities?', 'Summarize this criminal network'];

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        timestamp: nowLabel(),
        text: replyText || 'The agent returned an empty reply. Try rephrasing your question.',
        entity: matchedEntity,
        suggestedFollowups: followups,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-bot-${Date.now()}`,
          sender: 'assistant',
          timestamp: nowLabel(),
          text: `I could not reach the analysis agent (${detail}). Please check that the backend is running and try again.`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Tab' && !inputText) {
      e.preventDefault();
      setInputText(currentGhostSuggestion);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
  };

  // Convert ForensicEntity to Entity type for WhyFlaggedModal
  const whyFlaggedEntity: Entity = {
    id: modalEntity.id,
    name: modalEntity.name,
    type: (modalEntity.category === 'financial' ? 'account' : modalEntity.category === 'organization' ? 'case' : 'person') as any,
    role: modalEntity.role,
    riskLevel: modalEntity.confidence >= 0.85 ? 'high' : 'warning',
    identifier: modalEntity.pid,
    flaggedReasons: modalEntity.alerts.map((a) => a.t),
    notes: modalEntity.summary,
    dataSources: modalEntity.evidence.map((e) => e.rec),
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] max-w-5xl mx-auto pb-6">
      {/* 1. Header Toolbar: Clean heading and introduction only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffefb] border border-[#ddd6c6] rounded-xl px-5 py-3.5 shadow-2xs mb-4">
        <div>
          <h1 className="font-serif font-bold text-slate-900 text-base tracking-tight">
            AI Case Intelligence Interrogation
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Cross-examine all ingested FIR dockets, call records, bank ledgers, and vehicle tracking logs through direct inquiry.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[#e1ecdf] text-[#2d5c3f]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53] animate-pulse" />
            Active Copilot
          </span>
          <button
            type="button"
            onClick={handleResetChat}
            title="Clear inquiry session"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-[#f4f0e6] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Scrollable Results Canvas */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-6 pr-1 pb-24 scrollbar-thin"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Message Bubble */}
            {msg.sender === 'user' ? (
              <div className="max-w-[85%] sm:max-w-[70%] bg-[#182029] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm">
                <p className="text-xs leading-relaxed">{msg.text}</p>
                <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                  {msg.timestamp}
                </div>
              </div>
            ) : (
              <div className="w-full space-y-3.5">
                {/* Assistant Answer Box */}
                <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-2xl rounded-tl-xs p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ece6d8] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#f4ece1] text-[#a94e2c] flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 tracking-tight">
                        ANVESHAK Neural Synthesis
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Primary Narrative */}
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Entity Dossier Card (Rendered if entity recognized) */}
                  {msg.entity && (
                    <div className="mt-4 border border-[#e4ddcd] bg-[#faf8f4] rounded-xl p-4 space-y-3.5">
                      {/* Entity Hero Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e2d4] pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#182029] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0">
                            {msg.entity.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-base font-bold text-slate-900 tracking-tight">
                                {msg.entity.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ede8dc] text-slate-700">
                                {msg.entity.pid}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium">
                              {msg.entity.role}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              msg.entity.confidence >= 0.85
                                ? 'bg-[#f3ded2] text-[#8a3e21]'
                                : 'bg-[#f2e6c9] text-[#7d5612]'
                            }`}
                          >
                            Match Confidence: {(msg.entity.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#ede8dc] text-slate-700">
                            {msg.entity.centrality} Centrality
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-[#fffefb] p-2.5 rounded-lg border border-[#e8e2d4]">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Known Aliases
                          </span>
                          <span className="font-medium text-slate-900 mt-0.5 block">
                            {msg.entity.aliases.join(', ') || 'None recorded'}
                          </span>
                        </div>
                        <div className="bg-[#fffefb] p-2.5 rounded-lg border border-[#e8e2d4]">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Association
                          </span>
                          <span className="font-medium text-slate-900 mt-0.5 block truncate">
                            {msg.entity.association}
                          </span>
                        </div>
                        <div className="bg-[#fffefb] p-2.5 rounded-lg border border-[#e8e2d4]">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Jurisdictions / Locations
                          </span>
                          <span className="font-medium text-slate-900 mt-0.5 block">
                            {msg.entity.locations.join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Extracted Evidence Badges */}
                      {msg.entity.evidence.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Cross-Evidence Corroboration
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.entity.evidence.map((ev, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-[#fffefb] border border-[#e8e2d4] rounded-lg text-xs"
                              >
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#182029] text-white">
                                  {ev.src}
                                </span>
                                <span className="font-mono text-[11px] text-slate-700 font-semibold">
                                  {ev.rec}:
                                </span>
                                <span className="text-slate-600 truncate text-[11px]">
                                  {ev.rel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flagged Rules & Alerts */}
                      {msg.entity.alerts.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-[#a94e2c] uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Behavioral Alerts
                          </span>
                          <div className="space-y-1">
                            {msg.entity.alerts.map((al, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-[#fdfaf5] border border-[#ecdcc7] rounded-lg flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-slate-900 text-[11px]">
                                  {al.t}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {al.s}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direct Evidentiary Modal Links */}
                      <div className="pt-2 border-t border-[#e8e2d4] flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalEntity(msg.entity!);
                            if (onOpenBankingModal) onOpenBankingModal();
                            else setActiveModal('banking');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fffefb] hover:bg-[#ede7d8] border border-[#ddd6c6] text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                        >
                          <Landmark className="w-3 h-3 text-slate-600" />
                          <span>Bank Ledger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setModalEntity(msg.entity!);
                            if (onOpenCallModal) onOpenCallModal();
                            else setActiveModal('call');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fffefb] hover:bg-[#ede7d8] border border-[#ddd6c6] text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>Call Logs</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setModalEntity(msg.entity!);
                            if (onOpenVehicleModal) onOpenVehicleModal();
                            else setActiveModal('vehicle');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fffefb] hover:bg-[#ede7d8] border border-[#ddd6c6] text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                        >
                          <Car className="w-3 h-3 text-slate-600" />
                          <span>Vehicle Logs</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setModalEntity(msg.entity!);
                            if (onOpenFirModal) onOpenFirModal('FIR-102');
                            else setActiveModal('fir');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fffefb] hover:bg-[#ede7d8] border border-[#ddd6c6] text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          <span>FIR Document</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setModalEntity(msg.entity!);
                            if (onOpenWhyFlaggedModal) onOpenWhyFlaggedModal();
                            else setActiveModal('whyFlagged');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f3ded2] hover:bg-[#e9cdbf] text-[#8a3e21] border border-[#dfc3b5] text-xs font-bold transition-colors cursor-pointer ml-auto"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Why Flagged?</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cited Evidence Sources */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ece6d8]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Citations:
                      </span>
                      {msg.citations.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#f0ecdf] text-slate-700 text-[10px] font-mono font-medium"
                        >
                          [{c.label}] {c.doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strictly 1 or 2 Suggested Follow-Up Questions (User requested strictly 1 or 2) */}
                {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 pl-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Suggested Lead:
                    </span>
                    {msg.suggestedFollowups.slice(0, 2).map((lead, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fffefb] hover:bg-[#ede7d8] border border-[#ddd6c6] rounded-full text-xs font-medium text-slate-800 transition-all cursor-pointer shadow-2xs hover:border-slate-400 group"
                      >
                        <span className="text-[#a94e2c] group-hover:translate-x-0.5 transition-transform">
                          ↳
                        </span>
                        <span>{lead}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Thinking State Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 p-4 bg-[#fffefb] border border-[#ddd6c6] rounded-2xl rounded-tl-xs w-64 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#a94e2c] animate-spin" />
            <span className="text-xs text-slate-600 font-medium animate-pulse">
              Cross-correlating evidence files...
            </span>
          </div>
        )}
      </div>

      {/* 3. Central Sticky Chat Bar at the Bottom of the Screen */}
      <div className="sticky bottom-0 z-20 pt-3">
        <div className="relative max-w-3xl mx-auto w-full bg-[#fffefb]/95 backdrop-blur-md border border-[#c8beaa] rounded-2xl shadow-lg p-2 transition-all focus-within:border-slate-800 focus-within:shadow-xl">
          <div className="relative flex items-center">
            <div className="pl-3 text-[#a94e2c]">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Input Element */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-3 pr-24 py-2.5 bg-transparent text-xs text-slate-900 placeholder:text-transparent focus:outline-none font-medium z-10"
              autoFocus
            />

            {/* Faded Black Suggestion (Appears in the input bar in faded black color when empty, not actually typed) */}
            {!inputText && (
              <div
                onClick={() => {
                  setInputText(currentGhostSuggestion);
                  inputRef.current?.focus();
                }}
                className="absolute left-10 text-xs text-[#1e242b]/40 pointer-events-auto cursor-pointer truncate max-w-[calc(100%-120px)] select-none font-medium flex items-center gap-1.5 transition-opacity"
                title="Click or press Tab to use this query"
              >
                <span>{currentGhostSuggestion}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#1e242b]/20 text-[#1e242b]/50 hidden sm:inline font-mono">
                  Tab ⇥
                </span>
              </div>
            )}

            {/* Send Button */}
            <div className="absolute right-1.5 flex items-center gap-1 z-20">
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  inputText.trim()
                    ? 'bg-[#182029] text-white hover:bg-slate-800 shadow-xs'
                    : 'bg-[#ede8dc] text-slate-400 cursor-not-allowed'
                }`}
                title="Send inquiry"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Modals */}
      <BankingLedgerModal
        isOpen={activeModal === 'banking'}
        onClose={() => setActiveModal(null)}
        accountName={modalEntity.association}
        accountNumber={modalEntity.name + ' Ledger'}
      />

      <CallRecordsModal
        isOpen={activeModal === 'call'}
        onClose={() => setActiveModal(null)}
        entityName={modalEntity.name}
        phoneNumber="+91 98201 44921"
      />

      <VehicleLogsModal
        isOpen={activeModal === 'vehicle'}
        onClose={() => setActiveModal(null)}
        plateNumber="MH-31-EQ-9921"
        vehicleModel="Mahindra Scorpio (Black)"
      />

      <FirDocumentModal
        isOpen={activeModal === 'fir'}
        onClose={() => setActiveModal(null)}
        firNumber="FIR-Case-102"
      />

      <WhyFlaggedModal
        isOpen={activeModal === 'whyFlagged'}
        onClose={() => setActiveModal(null)}
        entity={whyFlaggedEntity}
      />
    </div>
  );
};

export default InvestigateView;
