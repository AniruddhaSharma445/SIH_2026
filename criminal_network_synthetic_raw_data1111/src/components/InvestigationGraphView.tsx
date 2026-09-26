import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  ShieldAlert,
  Phone,
  Landmark,
  MapPin,
  FileText,
  Truck,
  Building2,
  User,
  FileSearch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  INITIAL_NODES,
  INITIAL_EDGES,
  RelationshipNode,
  Edge,
  EntityCategory,
} from './EditorialRelationshipView';
import { CallRecordsModal } from './CallRecordsModal';
import { BankingLedgerModal } from './BankingLedgerModal';
import { VehicleLogsModal } from './VehicleLogsModal';
import { FirDocumentModal } from './FirDocumentModal';
import { EditorialConnectionsView } from './EditorialOtherTabs';

const getCategoryIcon = (category: EntityCategory) => {
  switch (category) {
    case 'person':
      return <User className="w-4 h-4 text-slate-300" />;
    case 'organization':
      return <Building2 className="w-4 h-4 text-indigo-300" />;
    case 'telecom':
      return <Phone className="w-4 h-4 text-blue-300" />;
    case 'financial':
      return <Landmark className="w-4 h-4 text-amber-300" />;
    case 'vehicle':
      return <Truck className="w-4 h-4 text-emerald-300" />;
    case 'location':
      return <MapPin className="w-4 h-4 text-rose-300" />;
    case 'document':
      return <FileText className="w-4 h-4 text-purple-300" />;
    default:
      return <FileSearch className="w-4 h-4 text-slate-300" />;
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

const edgeTypeColor: Record<Edge['type'], string> = {
  financial: '#a5751f',
  telecom: '#3b6fa0',
  logistics: '#2d6a4f',
  legal: '#7c4fa0',
  direct: '#b8533c',
};

interface AlertDerived {
  id: string;
  title: string;
  code: string;
  entityId: string;
  entityName: string;
  description: string;
  method: string;
}

interface InvestigationGraphViewProps {
  onInvestigateEntity?: (entityId: string) => void;
}

export const InvestigationGraphView: React.FC<InvestigationGraphViewProps> = ({
  onInvestigateEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<RelationshipNode[]>(INITIAL_NODES);
  const [edges] = useState<Edge[]>(INITIAL_EDGES);

  // --- NEW: Graph Filter States (From your Image 2) ---
  const [viewScope, setViewScope] = useState<'core' | 'expanded'>('core');
  const [activeFilter, setActiveFilter] = useState<'All' | 'People' | 'Financial' | 'Field & Telecom'>('All');

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [inspectedNode, setInspectedNode] = useState<RelationshipNode | null>(null);
  const [inspectedEdge, setInspectedEdge] = useState<Edge | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState<'call' | 'banking' | 'vehicle' | 'fir' | null>(null);

  // --- NEW: Filter Logic for Nodes and Edges ---
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Filter by Scope (Core vs Full)
      // Using 'any' here just in case 'tier' isn't explicitly defined in your local types yet
      if (viewScope === 'core' && (node as any).tier === 2) return false;

      // Filter by Category
      if (activeFilter === 'People' && node.category !== 'person') return false;
      if (activeFilter === 'Financial' && node.category !== 'financial' && node.category !== 'organization') return false;
      if (activeFilter === 'Field & Telecom' && node.category !== 'telecom' && node.category !== 'vehicle' && node.category !== 'location' && node.category !== 'document') return false;

      return true;
    });
  }, [nodes, viewScope, activeFilter]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);
  // ---------------------------------------------

  const alerts: AlertDerived[] = useMemo(() => {
    return nodes
      .filter((n) => n.details.flagReason)
      .map((n, i) => ({
        id: `AL-${101 + i}`,
        title:
          n.details.flagReason!.length > 40
            ? n.details.flagReason!.split('.')[0]
            : n.details.flagReason!,
        code: `AL-${101 + i}`,
        entityId: n.id,
        entityName: n.name,
        description: n.details.flagReason!,
        method: n.details.evidenceType === 'banking' ? 'transaction_pattern' : 'betweenness_centrality',
      }));
  }, [nodes]);

  const focusOnEntity = (nodeId: string) => {
    const match = nodes.find((n) => n.id === nodeId);
    if (match) {
      setInspectedEdge(null);
      setInspectedNode(match);
      // Automatically expand to full network if a hidden satellite node is selected
      if ((match as any).tier === 2 && viewScope === 'core') {
        setViewScope('expanded');
      }
    }
  };

  const activeFocus = useMemo(() => {
    const focusId = hoveredNodeId || inspectedNode?.id;
    if (!focusId) return null;
    const connectedNodeIds = new Set<string>([focusId]);
    const connectedEdgeIds = new Set<string>();
    visibleEdges.forEach((edge) => {
      if (edge.source === focusId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      } else if (edge.target === focusId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    });
    return { connectedNodeIds, connectedEdgeIds };
  }, [hoveredNodeId, inspectedNode, visibleEdges]);

  const handleMouseDown = (node: RelationshipNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = 960 / rect.width;
      const scaleY = 540 / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;
      setDragOffset({ x: svgX - node.x, y: svgY - node.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 540 / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingNodeId
          ? { ...n, x: Math.max(40, Math.min(920, svgX - dragOffset.x)), y: Math.max(40, Math.min(500, svgY - dragOffset.y)) }
          : n
      )
    );
  };

  const handleMouseUp = () => setDraggingNodeId(null);

  const handleNodeClick = (node: RelationshipNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectedEdge(null);
    setInspectedNode(node);
  };

  const handleEdgeClick = (edge: Edge, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectedNode(null);
    setInspectedEdge(edge);
  };

  const handleResetLayout = () => {
    setNodes(INITIAL_NODES);
    setZoomLevel(1);
    setInspectedNode(null);
    setInspectedEdge(null);
    setViewScope('core');
    setActiveFilter('All');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 h-[calc(100vh-140px)]">
      {/* LEFT: Alerts panel */}
      <div className="bg-white rounded-xl border border-[#e5e0d8] shadow-xs flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ece8df] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Alerts <span className="text-slate-400 font-medium">{alerts.length}</span></h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#f2efe9]">
          {alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => focusOnEntity(a.entityId)}
              className="w-full text-left px-4 py-3 hover:bg-[#faf7f2] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#b44c35]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b44c35]" />
                  {a.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{a.code}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">{a.entityName}</div>
              <p className="text-[11px] text-slate-600 leading-snug">{a.description}</p>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">{a.method}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER + RIGHT: Graph */}
      <div className="bg-[#182029] rounded-xl border border-white/10 shadow-xs overflow-hidden flex flex-col relative">
        
        {/* --- NEW: Filters Header Bar (From your Image 2) --- */}
        <div className="bg-white px-5 py-3 border-b border-[#ece8df] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Relationship view</span>
              <span className="text-[11px] font-medium text-slate-400">
                ({visibleNodes.length} entities • {visibleEdges.length} links)
              </span>
            </h3>
          </div>
          
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
          </div>
        </div>
        {/* ---------------------------------------------------- */}

        <div
          ref={containerRef}
          className="relative flex-1 bg-[#182029] overflow-hidden select-none"
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
              <filter id="igNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#1e262f" floodOpacity="0.1" />
              </filter>
              {(['financial', 'telecom', 'logistics', 'legal', 'direct'] as Edge['type'][]).map((t) => (
                <marker
                  key={t}
                  id={`arrow-${t}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeTypeColor[t]} />
                </marker>
              ))}
            </defs>

            <rect width="100%" height="100%" fill="#182029" />

            {/* Render VISIBLE edges instead of all edges */}
            {visibleEdges.map((edge) => {
              const sourceNode = visibleNodes.find((n) => n.id === edge.source);
              const targetNode = visibleNodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const isFocused = activeFocus && activeFocus.connectedEdgeIds.has(edge.id);
              const isHovered = hoveredEdgeId === edge.id;
              const isActive = isHovered || isFocused;
              const isDimmed = activeFocus && !isActive;
              const color = edgeTypeColor[edge.type];
              const midX = (sourceNode.x + targetNode.x) / 2;
              const midY = (sourceNode.y + targetNode.y) / 2;

              return (
                <g
                  key={edge.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  onClick={(e) => handleEdgeClick(edge, e)}
                >
                  <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y} stroke="transparent" strokeWidth="16" />
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={color}
                    strokeWidth={isActive ? 2.4 : 1.2}
                    strokeDasharray={edge.dashed ? '4 4' : 'none'}
                    opacity={isDimmed ? 0.15 : isActive ? 1 : 0.55}
                    markerEnd={`url(#arrow-${edge.type})`}
                    className="transition-all duration-150"
                  />

                  {edge.evidence && (
                    <g transform={`translate(${midX - 22}, ${midY - 7})`} opacity={isDimmed ? 0.15 : 0.85}>
                      <rect width="12" height="14" rx="2" fill="#ffffff" stroke={color} strokeWidth="1" />
                      <line x1="2.5" y1="4" x2="9.5" y2="4" stroke={color} strokeWidth="0.8" />
                      <line x1="2.5" y1="7" x2="9.5" y2="7" stroke={color} strokeWidth="0.8" />
                      <line x1="2.5" y1="10" x2="7" y2="10" stroke={color} strokeWidth="0.8" />
                    </g>
                  )}

                  {isActive && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect x="-36" y="-9" width="72" height="18" rx="9" fill="#1c252e" filter="url(#igNodeShadow)" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="600" fontFamily="system-ui, sans-serif" className="pointer-events-none select-none">
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render VISIBLE nodes instead of all nodes */}
            {visibleNodes.map((node) => {
              const isSelected = inspectedNode?.id === node.id;
              const isDimmed = activeFocus && !activeFocus.connectedNodeIds.has(node.id);
              const opacity = isDimmed ? 0.2 : 1;
              const isFlagged = !!node.details.flagReason;
              const isMediumRisk = !isFlagged && node.status === 'Needs review';

              const baseRadius = 20;
              const radius = isFlagged ? baseRadius + 7 : baseRadius;

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
                  {isFlagged && (
                    <circle r={radius + 6} fill="none" stroke="#c98a2e" strokeWidth="2" opacity="0.55" />
                  )}
                  {isMediumRisk && (
                    <circle r={radius + 5} fill="none" stroke="#9a978c" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />
                  )}
                  <circle
                    r={radius}
                    fill="#212b37"
                    stroke={isSelected ? '#b8533c' : '#3a4756'}
                    strokeWidth={isSelected ? 2.4 : 1.3}
                    filter="url(#igNodeShadow)"
                    className="transition-colors duration-100 group-hover:stroke-[#7b8695]"
                  />
                  <foreignObject x={-radius} y={-radius} width={radius * 2} height={radius * 2}>
                    <div className="w-full h-full flex items-center justify-center">
                      {getCategoryIcon(node.category)}
                    </div>
                  </foreignObject>
                  <text
                    x="0"
                    y={radius + 14}
                    textAnchor="middle"
                    fill="#e8e6df"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="system-ui, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/95 border border-[#e5e0d8] rounded-lg p-1 shadow-xs">
            <button onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] cursor-pointer">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] cursor-pointer">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetLayout} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-[#f6f4ef] cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* --- NEW: Enriched Node Inspection Card (From your Image 1) --- */}
          {inspectedNode && (
            <div className="absolute top-3 left-3 bottom-3 z-20 w-84 sm:w-96 max-h-[calc(100%-24px)] overflow-y-auto bg-white/98 backdrop-blur-md border border-[#e5e0d8] rounded-xl shadow-2xl p-4 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Header: Icon, Name, PID, Status, Close */}
              <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#ece8df]">
                <div className="flex items-start gap-2.5 min-w-0 flex-1 mr-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getCategoryStyles(inspectedNode.category)}`}>
                    {getCategoryIcon(inspectedNode.category)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                        {inspectedNode.name}
                      </h4>
                      {inspectedNode.details?.pid && (
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
                      {inspectedNode.details?.confidence && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {inspectedNode.details.confidence} Match
                        </span>
                      )}
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
                  {inspectedNode.details?.role || 'No specific role recorded'}
                </p>
              </div>

              {/* Simple Summary */}
              <div className="p-3 bg-[#faf8f4] border border-[#ece8df] rounded-lg mb-3 text-xs leading-relaxed text-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Summary
                </span>
                <p className="text-[11.5px] leading-relaxed text-slate-700">
                  {inspectedNode.details?.description || 'No summary available.'}
                </p>
              </div>

              {/* Simple Key Details Table */}
              <div className="p-3 bg-[#fdfcfb] border border-[#ece8df] rounded-lg text-xs space-y-2 mb-3">
                {inspectedNode.details?.association && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Syndicate Link:</span>
                    <span className="text-slate-800 font-semibold text-[11px] text-right">
                      {inspectedNode.details.association}
                    </span>
                  </div>
                )}

                {inspectedNode.details?.locations && inspectedNode.details.locations.length > 0 && (
                  <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Location:</span>
                    <span className="text-slate-700 font-medium text-[11px] text-right">
                      {inspectedNode.details.locations.join(' • ')}
                    </span>
                  </div>
                )}

                {inspectedNode.details?.aliases && inspectedNode.details.aliases.length > 0 && (
                  <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Other Names / Phone:</span>
                    <span className="text-slate-700 font-mono text-[11px] text-right">
                      {inspectedNode.details.aliases.join(', ')}
                    </span>
                  </div>
                )}

                {inspectedNode.details?.metrics && (
                  <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Key Numbers:</span>
                    <span className="text-slate-900 font-bold text-[11px] text-right">
                      {inspectedNode.details.metrics}
                    </span>
                  </div>
                )}

                {inspectedNode.details?.sourceDoc && (
                  <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Proof / Source:</span>
                    <span className="text-slate-700 font-medium text-[11px] text-right truncate max-w-[200px]" title={inspectedNode.details.sourceDoc}>
                      {inspectedNode.details.sourceDoc}
                    </span>
                  </div>
                )}
                
                {inspectedNode.details?.recentActivity && (
                  <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-[#f2eee7]">
                    <span className="text-slate-400 font-medium text-[11px] shrink-0">Latest Activity:</span>
                    <span className="text-slate-600 font-mono text-[10.5px] text-right">
                      {inspectedNode.details.recentActivity}
                    </span>
                  </div>
                )}
              </div>

              {/* Direct Connected Entities */}
              {inspectedNode.details?.directLinks && inspectedNode.details.directLinks.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Connected People &amp; Links ({inspectedNode.details.directLinks.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedNode.details.directLinks.map((link: any) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => focusOnEntity(link.id)}
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
                  <div><strong className="font-bold">Why Flagged:</strong> {inspectedNode.details.flagReason}</div>
                </div>
              )}

              {/* Investigation Button */}
              {onInvestigateEntity && (
                <button
                  onClick={() => onInvestigateEntity(inspectedNode.id.replace('ent-', '').replace('-', '_'))}
                  className="w-full mt-auto py-2 px-3 bg-[#a94e2c] hover:bg-[#8a3e21] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Ask AI Assistant about this person →</span>
                </button>
              )}
            </div>
          )}
          {/* ----------------------------------------------------------- */}

          {inspectedEdge && (
            <div className="absolute top-3 left-3 z-20 w-80 bg-white/98 backdrop-blur-xs border border-[#e5e0d8] rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-start justify-between pb-2 mb-2 border-b border-[#f0ede6]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#b8533c]">Relationship Link</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                    {visibleNodes.find((n) => n.id === inspectedEdge.source)?.name} → {visibleNodes.find((n) => n.id === inspectedEdge.target)?.name}
                  </h4>
                </div>
                <button onClick={() => setInspectedEdge(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Connection:</span>
                  <span className="font-semibold text-slate-800">{inspectedEdge.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-medium text-slate-700 capitalize">{inspectedEdge.type}</span>
                </div>
                <div className="p-2.5 bg-[#fbfaf8] border border-[#ece8df] rounded-lg text-slate-600">
                  <p className="text-[11px] leading-relaxed">
                    <strong>Proof / Record:</strong> {inspectedEdge.evidence || 'Verified through cross-matched case records.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CallRecordsModal isOpen={evidenceModalOpen === 'call'} onClose={() => setEvidenceModalOpen(null)} entityName={inspectedNode?.name || ''} />
      <BankingLedgerModal isOpen={evidenceModalOpen === 'banking'} onClose={() => setEvidenceModalOpen(null)} entityName={inspectedNode?.name || ''} />
      <VehicleLogsModal isOpen={evidenceModalOpen === 'vehicle'} onClose={() => setEvidenceModalOpen(null)} entityName={inspectedNode?.name || ''} />
      <FirDocumentModal isOpen={evidenceModalOpen === 'fir'} onClose={() => setEvidenceModalOpen(null)} entityName={inspectedNode?.name || ''} />

    </div>
     {/* Connections table, now living under the Investigation Graph tab */}
      <EditorialConnectionsView />
    </div>
  );
};