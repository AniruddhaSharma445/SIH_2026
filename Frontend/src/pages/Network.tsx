import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Share2,
  Filter,
  ShieldAlert,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Entity, Relationship, Investigation } from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import { WhyFlaggedModal } from '../components/WhyFlaggedModal';
import { EntityBadge, RiskBadge } from '../components/EntityBadge';

export const Network: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const caseParam = searchParams.get('case') || 'INV-2026-014';

  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseParam);
  const [nodes, setNodes] = useState<Entity[]>([]);
  const [edges, setEdges] = useState<Relationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [whyFlaggedEntity, setWhyFlaggedEntity] = useState<Entity | null>(null);
  const [whyFlaggedOpen, setWhyFlaggedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Load cases list
  useEffect(() => {
    api.getInvestigations().then(setCases);
  }, []);

  useEffect(() => {
    if (caseParam) {
      setSelectedCaseId(caseParam);
    }
  }, [caseParam]);

  // Load network graph data when selectedCaseId changes
  useEffect(() => {
    setLoading(true);
    api.getNetworkData(selectedCaseId).then((data) => {
      setNodes(data.nodes);
      setEdges(data.edges);
      setLoading(false);

      if (highlightParam) {
        const found = data.nodes.find((n) => n.id === highlightParam);
        if (found) {
          setSelectedNode(found);
        }
      }
    });
  }, [selectedCaseId, highlightParam]);

  const handleOpenWhyFlagged = (entity: Entity) => {
    setWhyFlaggedEntity(entity);
    setWhyFlaggedOpen(true);
  };

  const handleExportGraph = () => {
    setExportNotice('Network graph snapshot & topology metadata exported to dossier cache.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Network Relationship Graph
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connections between suspects, phones, accounts, vehicles, and locations
          </p>
        </div>

        {/* Case Selector & Export Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
            <span className="text-xs text-slate-400 font-medium">Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title.slice(0, 26)}...
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportGraph}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export View</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Graph Canvas Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <NetworkGraph
          nodes={nodes}
          edges={edges}
          height={620}
          selectedNodeId={selectedNode?.id}
          onSelectNode={(node) => setSelectedNode(node)}
          onOpenWhyFlagged={handleOpenWhyFlagged}
          showFilters={true}
        />
      </div>

      {/* Graph Analytical Metrics Footer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 block">Total Entities</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-slate-900">{nodes.length}</span>
            <span className="text-[11px] text-slate-500">Nodes in Cluster</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 block">Relationships</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-slate-900">{edges.length}</span>
            <span className="text-[11px] text-slate-500">Verified Edges</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 block">Key Node</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold text-slate-900 truncate">Rahul Sharma</span>
            <span className="text-[11px] text-rose-600 font-medium">Primary Hub</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 block">High-Risk Nodes</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-rose-600">
              {nodes.filter((n) => n.riskLevel === 'high').length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">Flagged</span>
          </div>
        </div>
      </div>

      {/* Why Flagged Modal */}
      <WhyFlaggedModal
        entity={whyFlaggedEntity}
        isOpen={whyFlaggedOpen}
        onClose={() => setWhyFlaggedOpen(false)}
      />
    </div>
  );
};
