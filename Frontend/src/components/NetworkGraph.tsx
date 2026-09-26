import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ShieldAlert,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Move,
  Share2,
} from 'lucide-react';
import { Entity, Relationship, EntityType, RiskLevel } from '../types';
import { entityColors, getEntityIcon, EntityBadge, RiskBadge } from './EntityBadge';

interface NetworkGraphProps {
  nodes: Entity[];
  edges: Relationship[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: Entity | null) => void;
  onOpenWhyFlagged?: (node: Entity) => void;
  height?: string | number;
  interactive?: boolean;
  showFilters?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes: initialNodes,
  edges,
  selectedNodeId: externalSelectedNodeId,
  onSelectNode,
  onOpenWhyFlagged,
  height = 580,
  interactive = true,
  showFilters = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Entity[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    externalSelectedNodeId || null
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Zoom & Pan transformation state
  const [transform, setTransform] = useState({ x: 20, y: 10, k: 0.95 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging single node
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialNodeX: number; initialNodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialNodeX: 0,
    initialNodeY: 0,
  });

  // Filter states
  const [typeFilters, setTypeFilters] = useState<Record<EntityType, boolean>>({
    person: true,
    phone: true,
    account: true,
    vehicle: true,
    location: true,
    fir: true,
    case: true,
  });

  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when initialNodes or externalSelectedNodeId change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    if (externalSelectedNodeId !== undefined) {
      setSelectedNodeId(externalSelectedNodeId);
    }
  }, [externalSelectedNodeId]);

  // Node lookup map for quick edge resolution
  const nodeMap = useMemo(() => {
    const map = new Map<string, Entity>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Filtered nodes
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!typeFilters[n.type]) return false;
      if (riskFilter === 'high' && n.riskLevel !== 'high') return false;
      if (riskFilter === 'warning' && n.riskLevel !== 'high' && n.riskLevel !== 'warning')
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = n.name.toLowerCase().includes(q);
        const matchId = n.identifier?.toLowerCase().includes(q);
        const matchRole = n.role?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole) return false;
      }
      return true;
    });
  }, [nodes, typeFilters, riskFilter, searchQuery]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  // Filtered edges where both source and target are visible
  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [edges, visibleNodeIds]);

  // Determine connected neighbors of selected or hovered node for highlighting
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const connectedNeighbors = useMemo(() => {
    if (!activeFocusId) return null;
    const set = new Set<string>();
    set.add(activeFocusId);
    edges.forEach((e) => {
      if (e.source === activeFocusId) set.add(e.target);
      if (e.target === activeFocusId) set.add(e.source);
    });
    return set;
  }, [activeFocusId, edges]);

  const connectedEdgeIds = useMemo(() => {
    if (!activeFocusId) return null;
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.source === activeFocusId || e.target === activeFocusId) {
        set.add(e.id);
      }
    });
    return set;
  }, [activeFocusId, edges]);

  // Handle node selection
  const handleNodeClick = (node: Entity, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = selectedNodeId === node.id ? null : node.id;
    setSelectedNodeId(newId);
    if (onSelectNode) {
      onSelectNode(newId ? node : null);
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setTransform((prev) => ({
      ...prev,
      k: Math.max(0.4, Math.min(2.5, prev.k + delta)),
    }));
  };

  const handleReset = () => {
    setTransform({ x: 40, y: 20, k: 0.95 });
    setSelectedNodeId(null);
    if (onSelectNode) onSelectNode(null);
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      // Dragging a specific node
      const dx = (e.clientX - dragStartRef.current.mouseX) / transform.k;
      const dy = (e.clientY - dragStartRef.current.mouseY) / transform.k;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggedNodeId
            ? {
                ...n,
                x: dragStartRef.current.initialNodeX + dx,
                y: dragStartRef.current.initialNodeY + dy,
              }
            : n
        )
      );
      return;
    }

    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(zoomFactor);
  };

  // Node Drag Start
  const startNodeDrag = (node: Entity, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNodeId(node.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialNodeX: node.x || 300,
      initialNodeY: node.y || 200,
    };
  };

  const activeSelectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl border border-slate-200 bg-[#f8fafc] overflow-hidden select-none shadow-xs"
      style={{ height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      />

      {/* Top Toolbar / Filter Header */}
      {showFilters && (
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          {/* Entity Type Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs text-xs">
            <span className="text-[10px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Filter:
            </span>
            {(['person', 'phone', 'account', 'vehicle', 'location'] as EntityType[]).map(
              (t) => {
                const active = typeFilters[t];
                const meta = entityColors[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setTypeFilters((prev) => ({ ...prev, [t]: !prev[t] }))
                    }
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-slate-100 text-slate-800 border border-slate-300'
                        : 'bg-transparent text-slate-400 border border-transparent line-through opacity-50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`}
                    />
                    <span className="capitalize">{meta.label.split('/')[0]}</span>
                  </button>
                );
              }
            )}
          </div>

          {/* Search & Risk Switch */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities..."
                className="pl-8 pr-3 py-1 text-xs bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-0.5 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setRiskFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                  riskFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('high')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                  riskFilter === 'high'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                High Risk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Canvas Controls (Zoom, Center) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 p-1 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs text-[11px] text-slate-600 pointer-events-auto">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Legend:
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-blue-600" /> Person
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-600" /> Phone
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-purple-600" /> Account
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-amber-600" /> Vehicle
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-rose-600" /> Location
        </span>
      </div>

      {/* SVG Canvas for Edges & Nodes */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onClick={() => {
          setSelectedNodeId(null);
          if (onSelectNode) onSelectNode(null);
        }}
      >
        <defs>
          {/* Arrow markers for directed relationships */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
          </marker>
          <marker
            id="arrow-highlight"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
          </marker>
          <marker
            id="arrow-risk"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e11d48" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* 1. Render Relationships (Edges) */}
          {visibleEdges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const sx = source.x || 100;
            const sy = source.y || 100;
            const tx = target.x || 200;
            const ty = target.y || 200;

            const isEdgeConnected = connectedEdgeIds?.has(edge.id);
            const isDimmed = activeFocusId && !isEdgeConnected;

            // Curve calculation for aesthetic graph lines
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;
            const dx = tx - sx;
            const dy = ty - sy;
            const norm = Math.sqrt(dx * dx + dy * dy) || 1;
            // gentle subtle curve
            const offset = 10;
            const cx = mx - (dy / norm) * offset;
            const cy = my + (dx / norm) * offset;

            const isHighRisk = edge.riskLevel === 'high';

            const strokeColor = isEdgeConnected
              ? '#2563eb'
              : isHighRisk
              ? '#e11d48'
              : '#cbd5e1';

            const strokeWidth = isEdgeConnected ? 2 : isHighRisk ? 1.5 : 1.25;

            // Only show labels on active, connected, or high risk edges to avoid visual clutter
            const showEdgeLabel =
              isEdgeConnected ||
              isHighRisk ||
              hoveredNodeId === edge.source ||
              hoveredNodeId === edge.target ||
              selectedEdgeId === edge.id;

            return (
              <g
                key={edge.id}
                className={`transition-opacity duration-200 ${
                  isDimmed ? 'opacity-20' : 'opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                }}
              >
                {/* Connecting line */}
                <path
                  d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.type === 'CALLED' ? '4 3' : undefined}
                  markerEnd={
                    isEdgeConnected
                      ? 'url(#arrow-highlight)'
                      : isHighRisk
                      ? 'url(#arrow-risk)'
                      : 'url(#arrow-default)'
                  }
                />

                {/* Subtle Relationship Tag */}
                {edge.label && showEdgeLabel && (
                  <g
                    transform={`translate(${cx}, ${cy})`}
                    className="cursor-pointer"
                  >
                    <rect
                      x={-(edge.label.length * 3.1 + 6)}
                      y={-8}
                      width={edge.label.length * 6.2 + 12}
                      height={16}
                      rx={4}
                      fill="#ffffff"
                      fillOpacity={0.94}
                      stroke={strokeColor}
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={9}
                      fontWeight={600}
                      fill={strokeColor}
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Render Entities (Nodes) */}
          {visibleNodes.map((node) => {
            const x = node.x || 200;
            const y = node.y || 200;
            const meta = entityColors[node.type] || entityColors.person;
            const isSelected = selectedNodeId === node.id;
            const isConnected = connectedNeighbors?.has(node.id);
            const isDimmed = activeFocusId && !isConnected;

            const radius = isSelected ? 21 : 18;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className={`cursor-pointer transition-opacity duration-200 ${
                  isDimmed ? 'opacity-25' : 'opacity-100'
                }`}
                onMouseDown={(e) => startNodeDrag(node, e)}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Selection outer ring */}
                {isSelected && (
                  <circle
                    r={radius + 4}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                )}

                {/* Node Solid Circle */}
                <circle
                  r={radius}
                  fill="#ffffff"
                  stroke={
                    node.riskLevel === 'high'
                      ? '#e11d48'
                      : isSelected
                      ? '#2563eb'
                      : meta.border.includes('emerald')
                      ? '#10b981'
                      : meta.border.includes('purple')
                      ? '#8b5cf6'
                      : meta.border.includes('amber')
                      ? '#f59e0b'
                      : '#3b82f6'
                  }
                  strokeWidth={isSelected ? 2.5 : 1.75}
                />

                {/* Inner Icon Background */}
                <circle
                  r={radius - 3.5}
                  className={`${meta.bg}`}
                />

                {/* Center SVG Icon representation */}
                <foreignObject
                  x={-8}
                  y={-8}
                  width={16}
                  height={16}
                  className="pointer-events-none"
                >
                  <div className={`w-full h-full flex items-center justify-center ${meta.iconColor}`}>
                    {getEntityIcon(node.type, 'w-3 h-3')}
                  </div>
                </foreignObject>

                {/* Risk Dot on top right */}
                {node.riskLevel === 'high' && (
                  <circle
                    cx={12}
                    cy={-12}
                    r={4}
                    fill="#e11d48"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}

                {/* Clean, sober SVG Node Title Label (without heavy black background) */}
                <text
                  y={radius + 13}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={600}
                  fill="#1e293b"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinejoin="round"
                >
                  {node.name}
                </text>

                {/* Secondary Role / Identifier */}
                {(node.role || node.identifier) && (
                  <text
                    y={radius + 25}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9.5}
                    fontWeight={400}
                    fill="#64748b"
                    paintOrder="stroke"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                  >
                    {node.role ? node.role : node.identifier}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Inspector Drawer (Right Side) */}
      {activeSelectedNode && (
        <div className="absolute top-3 right-3 bottom-3 w-80 sm:w-88 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-30 p-5 flex flex-col justify-between animate-in slide-in-from-right-4 duration-200 overflow-y-auto">
          <div>
            {/* Header / Dismiss */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <EntityBadge type={activeSelectedNode.type} size="md" />
                <RiskBadge level={activeSelectedNode.riskLevel} size="sm" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeId(null);
                  if (onSelectNode) onSelectNode(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entity Name & Role */}
            <div className="mt-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {activeSelectedNode.name}
              </h3>
              {activeSelectedNode.identifier && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {activeSelectedNode.identifier}
                </p>
              )}
              {activeSelectedNode.role && (
                <p className="text-xs font-semibold text-blue-700 mt-1">
                  Role: {activeSelectedNode.role}
                </p>
              )}
            </div>

            {/* Why Flagged Trigger */}
            <div className="mt-4 p-3 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Flagged Triggers ({activeSelectedNode.flaggedReasons?.length || 0})
                </span>
                <span className="text-[10px] font-bold text-rose-600 uppercase">
                  {activeSelectedNode.riskLevel} Risk
                </span>
              </div>

              <ul className="space-y-1.5">
                {(activeSelectedNode.flaggedReasons || []).slice(0, 3).map((r, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {onOpenWhyFlagged && (
                <button
                  type="button"
                  onClick={() => onOpenWhyFlagged(activeSelectedNode)}
                  className="mt-3 w-full py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Inspect Full &quot;Why Flagged?&quot; Report</span>
                </button>
              )}
            </div>

            {/* Direct Connected Entities */}
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Directly Connected Relationships
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {edges
                  .filter(
                    (e) =>
                      e.source === activeSelectedNode.id ||
                      e.target === activeSelectedNode.id
                  )
                  .map((edge) => {
                    const otherId =
                      edge.source === activeSelectedNode.id ? edge.target : edge.source;
                    const other = nodeMap.get(otherId);
                    if (!other) return null;

                    return (
                      <div
                        key={edge.id}
                        onClick={() => setSelectedNodeId(other.id)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <EntityBadge type={other.type} size="sm" showIcon={false} />
                          <span className="font-semibold text-slate-800 truncate max-w-[110px]">
                            {other.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-600 truncate max-w-[90px]">
                          {edge.label || edge.type}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Drag node to re-cluster</span>
            <span className="font-mono">ID: {activeSelectedNode.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};
