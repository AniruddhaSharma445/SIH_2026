import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Building2,
  Phone,
  Truck,
  Landmark,
  FileText,
  MapPin,
  X,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface DashboardClusterViewProps {
  onOpenCase?: (caseId?: string) => void;
  onInvestigateEntity?: (entityId: string) => void;
}

// --- MOCK DATA ---
const ENTITIES = [
  { id: 'ent-rahul', name: 'Rahul Sharma', subtitle: 'Prime bridge entity • 18 burst calls', category: 'person', status: 'Needs review' },
  { id: 'ent-amit', name: 'Amit Verma', subtitle: 'Delivery planning • New Market', category: 'person', status: 'Needs review' },
  { id: 'ent-suresh', name: 'Suresh Patel', subtitle: 'Circular mule • Return transfer ₹7,500', category: 'person', status: 'Needs review' },
  { id: 'ent-neeraj', name: 'Neeraj Khan', subtitle: 'Sehore Road meeting • MP04EF9012', category: 'person', status: 'Needs review' },
  { id: 'ent-vikram', name: 'Vikram Singh', subtitle: 'Kolar Road transit • MP04GH3456', category: 'person', status: 'Resolved' },
  { id: 'ent-pooja', name: 'Pooja Mehta', subtitle: 'Kolar Road companion • Phone 900001', category: 'person', status: 'Resolved' },
  { id: 'ent-manish', name: 'Manish Gupta', subtitle: 'Misrod contact • MP04NP6789', category: 'person', status: 'Resolved' },
];

const GRID_CASES = [
  {
    id: 'CASE-001', ref: 'FIR/KOL/2026/0412', title: 'Operation Silver Ledger',
    desc: 'Layered movement of ₹3.6 Cr from Kolkata accounts to a Dubai free-zone trader through a nominee-run trading company.',
    priority: 'CRITICAL', entities: 14, links: 19, alerts: 4,
    nodes: [
      { x: 30, y: 15, type: 'organization', flagged: false },
      { x: 70, y: 30, type: 'financial', flagged: true },
      { x: 140, y: 40, type: 'person', flagged: false },
    ],
  },
  {
    id: 'CASE-002', ref: 'FIR/JMT/2026/1109', title: 'Operation Night Relay',
    desc: 'SIM-box gateway routing impersonation calls from Jamtara, proceeds swept into a single bank account.',
    priority: 'HIGH', entities: 13, links: 17, alerts: 3,
    nodes: [
      { x: 40, y: 20, type: 'telecom', flagged: true },
      { x: 90, y: 35, type: 'person', flagged: false },
      { x: 150, y: 25, type: 'financial', flagged: false },
    ],
  },
  {
    id: 'CASE-003', ref: 'FIR/MUM/2026/0871', title: 'Operation Blue Harbor',
    desc: 'Reefer truck making unmanifested runs between JNPT and a Bhiwandi cold-storage warehouse.',
    priority: 'MEDIUM', entities: 11, links: 12, alerts: 2,
    nodes: [
      { x: 50, y: 25, type: 'vehicle', flagged: true },
      { x: 110, y: 15, type: 'location', flagged: false },
      { x: 160, y: 35, type: 'organization', flagged: false },
    ],
  },
  {
    id: 'CASE-004', ref: 'FIR/AMD/2026/0234', title: 'Operation Paper Trail',
    desc: 'Circular payments between a polymer trader and a cancelled-GSTIN entity, matching fake input-tax-credit claims.',
    priority: 'LOW', entities: 7, links: 9, alerts: 1,
    nodes: [
      { x: 35, y: 25, type: 'financial', flagged: false },
      { x: 95, y: 40, type: 'financial', flagged: true },
      { x: 155, y: 20, type: 'organization', flagged: false },
    ],
  },
];

const ALL_CASES = [
  ...GRID_CASES,
  { id: 'CASE-005', ref: 'FIR/DEL/2026/0991', title: 'Operation Phantom Cargo', desc: 'Dummy waybills for tax evasion.', priority: 'HIGH', entities: 21, links: 34, alerts: 5 },
  { id: 'CASE-006', ref: 'FIR/BLR/2026/0112', title: 'Operation Silent Ring', desc: 'Illegal VOIP exchange routing.', priority: 'MEDIUM', entities: 9, links: 11, alerts: 1 },
];

// --- HELPERS ---
const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'person': return '#475569'; // Slate
    case 'organization': return '#4338ca'; // Indigo
    case 'financial': return '#b45309'; // Amber
    case 'telecom': return '#1d4ed8'; // Blue
    case 'vehicle': return '#047857'; // Emerald
    case 'location': return '#be123c'; // Rose
    default: return '#94a3b8';
  }
};

export const DashboardClusterView: React.FC<DashboardClusterViewProps> = ({
  onOpenCase,
  onInvestigateEntity,
}) => {
  // Entities Filter State
  const [entityFilter, setEntityFilter] = useState<'All' | 'Needs review' | 'Resolved'>('All');
  const [entitySearch, setEntitySearch] = useState('');

  // Cases Table Filter State
  const [caseFilter, setCaseFilter] = useState('All');
  const [caseSearch, setCaseSearch] = useState('');

  // Filtered Entities Logic
  const filteredEntities = useMemo(() => {
    return ENTITIES.filter((item) => {
      if (entityFilter !== 'All' && item.status !== entityFilter) return false;
      if (entitySearch.trim()) {
        const q = entitySearch.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.subtitle.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entityFilter, entitySearch]);

  // Filtered Cases Logic
  const filteredCases = useMemo(() => {
    return ALL_CASES.filter((c) => {
      if (caseFilter !== 'All' && c.priority !== caseFilter) return false;
      if (caseSearch.trim()) {
        const q = caseSearch.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [caseFilter, caseSearch]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* TOP SECTION: Left (Entities List) + Right (2x2 Case Grid) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">
        
        {/* LEFT: Entities of Interest Block (Retained exactly as requested) */}
        <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs overflow-hidden flex flex-col h-[550px]">
          <div className="px-5 py-3.5 border-b border-[#ece8df] flex items-center justify-between bg-white">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Entities of interest</h3>
            <span className="text-[11px] text-slate-400 font-medium">Ranked by centrality</span>
          </div>

          <div className="p-3 border-b border-[#ece8df] bg-[#faf9f6] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                placeholder="Search entities, aliases..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#e0dbd1] rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#b8533c]"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              {['All', 'Needs review', 'Resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setEntityFilter(f as any)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    entityFilter === f ? 'bg-[#1c252e] text-white shadow-2xs' : 'bg-white text-slate-600 border border-[#e5e0d8]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f2efe9]">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                onClick={() => onInvestigateEntity && onInvestigateEntity(entity.id)}
                className="px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#faf7f2] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#f6f4ee] border border-[#ece7de] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{entity.name}</h4>
                    <p className="text-[10.5px] text-slate-500 truncate mt-0.5">{entity.subtitle}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold border ${
                  entity.status === 'Needs review' ? 'bg-[#fcf0ed] text-[#b44c35] border-[#f4dad2]' : 'bg-[#eef6f0] text-[#2d6a4f] border-[#d5ecdc]'
                }`}>
                  {entity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: 2x2 Grid of Priority Investigation Dockets */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Priority Investigation Dockets
            </h2>
            <span className="text-xs text-slate-500">Select case to inspect topology</span>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {GRID_CASES.map((c) => (
              <div
                key={c.id}
                onClick={() => onOpenCase && onOpenCase(c.id)}
                className="bg-white rounded-xl border border-[#e5e0d8] hover:border-[#b8533c] hover:shadow-lg transition-all cursor-pointer flex flex-col overflow-hidden group"
              >
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.priority === 'CRITICAL' ? 'bg-rose-600 animate-pulse' : c.priority === 'HIGH' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="text-[10px] font-bold text-slate-800">{c.id} <span className="text-slate-400 font-normal">· {c.ref}</span></span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyles(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                  
                  <h3 className="font-serif font-bold text-slate-900 text-[15px] mb-1.5 group-hover:text-[#b8533c] transition-colors">{c.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{c.desc}</p>

                  {/* Embedded Mini Graph */}
                  <div className="mt-4 relative bg-[#faf9f6] rounded-lg border border-[#ece8df] h-20 w-full overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 200 60" className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Draw lines between nodes */}
                      <line x1={c.nodes[0].x} y1={c.nodes[0].y} x2={c.nodes[1].x} y2={c.nodes[1].y} stroke="#d5cfc5" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1={c.nodes[1].x} y1={c.nodes[1].y} x2={c.nodes[2].x} y2={c.nodes[2].y} stroke="#d5cfc5" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1={c.nodes[0].x} y1={c.nodes[0].y} x2={c.nodes[2].x} y2={c.nodes[2].y} stroke="#d5cfc5" strokeWidth="1" strokeDasharray="2 2" />
                      
                      {/* Draw nodes */}
                      {c.nodes.map((node, i) => (
                        <g key={i}>
                          {node.flagged && (
                            <circle cx={node.x} cy={node.y} r="6" fill="none" stroke="#b44c35" strokeWidth="1.5" className="animate-pulse" />
                          )}
                          <circle cx={node.x} cy={node.y} r="3.5" fill={getNodeColor(node.type)} />
                        </g>
                      ))}
                    </svg>
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono font-bold text-slate-400 tracking-wider">
                      SUB-GRAPH PREVIEW
                    </span>
                  </div>
                </div>

                <div className="bg-[#fbfaf8] border-t border-[#ece8df] px-4 py-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 font-semibold text-slate-700">
                    <span>{c.entities} entities</span>
                    <span className="text-slate-300">·</span>
                    <span>{c.links} links</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {c.alerts} alerts</span>
                  </div>
                  <span className="font-bold text-[#b8533c] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend Row underneath 2x2 Grid */}
          <div className="mt-4 px-3 py-2.5 bg-white border border-[#e5e0d8] rounded-lg flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#475569]"></span> Person</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4338ca]"></span> Org</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#b45309]"></span> Account</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]"></span> Phone</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#be123c]"></span> Location</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#047857]"></span> Vehicle</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-rose-600 bg-transparent flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                </span>
                Flagged Node
              </span>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider">FIG 1.0 TOPOLOGY KEY</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* BOTTOM SECTION: Full Width "All Cases" Table */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-[#ece8df] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#faf9f6]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">All Cases Directory</h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-[#f4f1ea] px-2 py-0.5 rounded-full border border-[#e0dbd1]">
              {ALL_CASES.length} Total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-48 pl-8 pr-3 py-1.5 bg-white border border-[#e0dbd1] rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#b8533c]"
              />
            </div>
            
            <div className="flex items-center gap-1 text-[11px]">
              {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  onClick={() => setCaseFilter(p)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    caseFilter === p ? 'bg-[#1c252e] text-white' : 'bg-white text-slate-600 border border-[#e5e0d8] hover:bg-[#f2efe9]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-[#ece8df]">
                <th className="px-5 py-3">Case ID & Ref</th>
                <th className="px-5 py-3">Case Name / Operation</th>
                <th className="px-5 py-3 text-center">Entities Extracted</th>
                <th className="px-5 py-3">Lead Investigator</th>
                <th className="px-5 py-3 text-right">Priority Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8df] text-xs">
              {filteredCases.map((c, index) => (
                <tr
                  key={c.id}
                  onClick={() => onOpenCase && onOpenCase(c.id)}
                  className={`cursor-pointer transition-colors group ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#fcfbf9]'
                  } hover:bg-[#faf7f2]`}
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900 group-hover:text-[#b8533c] transition-colors">{c.id}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">{c.ref}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-800">{c.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-sm">{c.desc}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center font-bold text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5 border border-slate-200">
                      {c.entities} Nodes
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#a94e2c] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                        RS
                      </div>
                      <span className="font-medium text-slate-700">Riya Sen</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getPriorityStyles(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-xs">
                    No cases match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};