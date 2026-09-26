import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Share2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  User,
  Phone,
  Landmark,
  Car,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Investigation,
  Entity,
  Relationship,
  TimelineEvent,
  PatternDetection,
  AlertItem,
} from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import { Timeline } from '../components/Timeline';
import { PatternCard } from '../components/PatternCard';
import { AlertCard } from '../components/AlertCard';
import { EntityBadge, RiskBadge } from '../components/EntityBadge';
import { WhyFlaggedModal } from '../components/WhyFlaggedModal';
import { SuspectCard } from '../components/SuspectCard';

export const CaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [nodes, setNodes] = useState<Entity[]>([]);
  const [edges, setEdges] = useState<Relationship[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Why Flagged modal
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [whyFlaggedOpen, setWhyFlaggedOpen] = useState(false);

  // Active tab inside Case Details
  const [activeTab, setActiveTab] = useState<'all' | 'network' | 'entities' | 'patterns' | 'timeline'>(
    'all'
  );

  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        const caseId = id || 'INV-2026-014';
        const [inv, network, tl, pats, alt] = await Promise.all([
          api.getInvestigationById(caseId),
          api.getNetworkData(caseId),
          api.getTimeline(caseId),
          api.getPatterns(caseId),
          api.getAlerts(caseId),
        ]);

        setInvestigation(inv);
        setNodes(network.nodes);
        setEdges(network.edges);
        setTimelineEvents(tl);
        setPatterns(pats);
        setAlerts(alt);
      } catch (err) {
        console.error('Error fetching case details', err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [id]);

  const handleOpenWhyFlagged = (entity: Entity) => {
    setSelectedEntity(entity);
    setWhyFlaggedOpen(true);
  };

  if (!investigation) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-500">Loading case dossier...</p>
      </div>
    );
  }

  const primarySuspect = nodes.find((n) => n.id === 'ent-01') || nodes[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/investigations')}
          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Investigations</span>
        </button>
        <span>/</span>
        <span className="font-mono text-slate-900 font-semibold">
          {investigation.caseNumber}
        </span>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                {investigation.caseNumber}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {investigation.status}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {investigation.priority} Priority
              </span>
              <span className="text-xs text-slate-400 font-mono">
                FIR: {investigation.firNumber}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {investigation.title}
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Department: <strong className="text-slate-700">{investigation.department}</strong> • Lead: {investigation.leadInvestigator} • Location: {investigation.location}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/network?case=${investigation.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Dedicated Graph Studio</span>
            </button>
          </div>
        </div>

        {/* Case Narrative Summary */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Investigation Summary &amp; Scope
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {investigation.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {investigation.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Case Created:</span>
              <span className="font-semibold text-slate-800">{investigation.createdDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Last Synced:</span>
              <span className="font-semibold text-slate-800">{investigation.updatedDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Persons of Interest:</span>
              <span className="font-semibold text-blue-600">{investigation.stats.personsCount}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">High Risk Anomalies:</span>
              <span className="font-semibold text-rose-600">{investigation.stats.highRiskCount}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 overflow-x-auto">
          {[
            { id: 'all', label: 'Complete Overview' },
            { id: 'network', label: 'Network Graph' },
            { id: 'entities', label: `Key Entities (${nodes.length})` },
            { id: 'patterns', label: `Detected Patterns (${patterns.length})` },
            { id: 'timeline', label: `Timeline (${timelineEvents.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Network Overview Section */}
      {(activeTab === 'all' || activeTab === 'network') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Case Network Topology &amp; Relationships
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-layer graph showing entity linkages across Telecom, Banking, Transport, and Legal datasets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (primarySuspect) handleOpenWhyFlagged(primarySuspect);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Inspect Primary Node</span>
            </button>
          </div>

          <NetworkGraph
            nodes={nodes}
            edges={edges}
            height={520}
            onOpenWhyFlagged={handleOpenWhyFlagged}
          />
        </div>
      )}

      {/* 2. Key Entities Section */}
      {(activeTab === 'all' || activeTab === 'entities') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Key Entities In Scope
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Resolved identities, phone lines, bank accounts, and transport assets
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {nodes.length} Entities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((entity) => (
              <div
                key={entity.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <EntityBadge type={entity.type} size="sm" />
                    <RiskBadge level={entity.riskLevel} size="sm" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {entity.name}
                  </h4>
                  {entity.identifier && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      {entity.identifier}
                    </p>
                  )}
                  {entity.role && (
                    <p className="text-xs text-slate-700 font-medium mt-1.5">
                      <span className="text-slate-400">Role: </span>
                      {entity.role}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {entity.dataSources?.length || 1} sources
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenWhyFlagged(entity)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Why Flagged?</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detected Patterns Section */}
      {(activeTab === 'all' || activeTab === 'patterns') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Detected Graph &amp; Topological Patterns
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Analytical indicators extracted from multi-source cross-referencing
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {patterns.length} Anomaly Signatures
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Timeline & Alerts Section */}
      {(activeTab === 'all' || activeTab === 'timeline') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Timeline
              events={timelineEvents}
              title="Investigation Timeline"
              subtitle="Step-by-step chronology from initial complaint to network discovery"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Case Alerts
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Active notifications
              </span>
            </div>

            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Why Flagged Modal */}
      <WhyFlaggedModal
        entity={selectedEntity}
        isOpen={whyFlaggedOpen}
        onClose={() => setWhyFlaggedOpen(false)}
        onNavigateToGraph={(entityId) => navigate(`/network?highlight=${entityId}`)}
      />
    </div>
  );
};
