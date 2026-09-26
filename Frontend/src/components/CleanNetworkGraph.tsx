import React, { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Phone,
  Landmark,
  Car,
  FileText,
  MapPin,
  User,
  X,
  ArrowRight,
  Search,
  Filter,
  Layers,
  Radio,
  Building,
  Smartphone,
  ShieldAlert,
  CreditCard,
  Eye,
} from 'lucide-react';
import { Entity, Relationship } from '../types';

interface CleanNetworkGraphProps {
  nodes: Entity[];
  edges: Relationship[];
  selectedNodeId: string;
  onSelectNode: (node: Entity) => void;
  onSelectEdge?: (edge: Relationship) => void;
  onViewCallRecords?: () => void;
  onViewBankingLedger?: () => void;
  onViewVehicleLogs?: () => void;
  onViewFirDocument?: () => void;
  onViewLocationMap?: () => void;
}

// Second-degree extended nodes for "2-Hop" mode
interface ExtendedNode {
  id: string;
  name: string;
  type: string;
  category: string;
  role: string;
  subtitle: string;
  x: number;
  y: number;
  parentId: string;
  riskLevel: 'high' | 'warning' | 'verified' | 'neutral';
}

interface ExtendedEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  dashed?: boolean;
}

const EXTENDED_NODES: ExtendedNode[] = [
  {
    id: 'ext-phone-tower',
    name: 'Tower: Central BTS-04',
    type: 'tower',
    category: 'location',
    role: 'Cellular Base Station',
    subtitle: 'Triangulation Node',
    x: 60,
    y: 200,
    parentId: 'ent-phone',
    riskLevel: 'neutral',
  },
  {
    id: 'ext-phone-imei',
    name: 'IMEI: 864201049281',
    type: 'device',
    category: 'phone',
    role: 'OnePlus Nord 2 (Black)',
    subtitle: 'Handset Hardware ID',
    x: 60,
    y: 320,
    parentId: 'ent-phone',
    riskLevel: 'warning',
  },
  {
    id: 'ext-aman-company',
    name: 'Om Logistics Ltd',
    type: 'company',
    category: 'account',
    role: 'Front Shell Entity',
    subtitle: 'Logistics Shell Mandate',
    x: 120,
    y: 50,
    parentId: 'ent-aman',
    riskLevel: 'high',
  },
  {
    id: 'ext-sbi-mule',
    name: 'Suresh Patel',
    type: 'person',
    category: 'person',
    role: 'Identified Cash Mule',
    subtitle: 'ATM Cash Withdrawal',
    x: 820,
    y: 60,
    parentId: 'ent-sbi',
    riskLevel: 'high',
  },
  {
    id: 'ext-vikram-desk',
    name: 'Indore Hawala Desk',
    type: 'company',
    category: 'account',
    role: 'Informal Channel Desk',
    subtitle: 'Financial Conduit',
    x: 850,
    y: 260,
    parentId: 'ent-vikram',
    riskLevel: 'high',
  },
  {
    id: 'ext-vehicle-toll',
    name: 'Bhopal Outer Toll',
    type: 'toll',
    category: 'location',
    role: 'FASTag Plaza #14',
    subtitle: 'ANPR Camera Sighting',
    x: 820,
    y: 460,
    parentId: 'ent-vehicle',
    riskLevel: 'warning',
  },
];

const EXTENDED_EDGES: ExtendedEdge[] = [
  {
    id: 'ext-rel-phone-tower',
    source: 'ent-phone',
    target: 'ext-phone-tower',
    label: 'Cell Ping',
    type: 'CELL_PING',
    dashed: true,
  },
  {
    id: 'ext-rel-phone-imei',
    source: 'ent-phone',
    target: 'ext-phone-imei',
    label: 'Hardware ID',
    type: 'HARDWARE_LINK',
    dashed: true,
  },
  {
    id: 'ext-rel-aman-company',
    source: 'ent-aman',
    target: 'ext-aman-company',
    label: 'Director',
    type: 'CORPORATE_LINK',
    dashed: true,
  },
  {
    id: 'ext-rel-sbi-mule',
    source: 'ent-sbi',
    target: 'ext-sbi-mule',
    label: 'Cash Mule',
    type: 'MULE_LINK',
    dashed: true,
  },
  {
    id: 'ext-rel-vikram-desk',
    source: 'ent-vikram',
    target: 'ext-vikram-desk',
    label: 'Routing',
    type: 'HAWALA_ROUTING',
    dashed: true,
  },
  {
    id: 'ext-rel-vehicle-toll',
    source: 'ent-vehicle',
    target: 'ext-vehicle-toll',
    label: 'FASTag Hit',
    type: 'TOLL_DETECTION',
    dashed: true,
  },
  // Cross-link between Aman and Burner Phone
  {
    id: 'ext-cross-aman-phone',
    source: 'ent-aman',
    target: 'ent-phone',
    label: 'Calls (12)',
    type: 'CROSS_CALL',
    dashed: false,
  },
];

export const CleanNetworkGraph: React.FC<CleanNetworkGraphProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onSelectEdge,
  onViewCallRecords,
  onViewBankingLedger,
  onViewVehicleLogs,
  onViewFirDocument,
  onViewLocationMap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mode: 1-Hop (Direct) vs 2-Hop (Extended)
  const [depthMode, setDepthMode] = useState<'1-hop' | '2-hop'>('1-hop');

  // Filter by Entity Type
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick canvas search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Floating relationship card state
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>('rel-trinetra-phone');
  const [showEdgeCard, setShowEdgeCard] = useState<boolean>(true);

  // Center node: Rahul Sharma (with ent-rohan fallback)
  const centerNode = nodes.find((n) => n.id === 'ent-rahul') || nodes.find((n) => n.id === 'ent-rohan') || nodes[0];

  // Specific symmetric radial positions for the 8 Operation Trinetra entities
  // Viewport center: (470, 270) in 940x540 viewport
  const nodePositions: Record<string, { x: number; y: number }> = {
    'ent-rahul': { x: 470, y: 270 },
    'ent-rohan': { x: 470, y: 270 },
    'ent-phone': { x: 190, y: 270 },    // Left
    'ent-aman': { x: 260, y: 120 },     // Top-Left
    'ent-sbi': { x: 680, y: 120 },      // Top-Right
    'ent-vikram': { x: 750, y: 270 },   // Right
    'ent-vehicle': { x: 680, y: 420 },  // Bottom-Right
    'ent-fir': { x: 470, y: 450 },      // Bottom
    'ent-bhopal': { x: 260, y: 420 },   // Bottom-Left
  };

  // Node operational metadata tags for realistic intelligence display
  const nodeSubtitles: Record<string, string> = {
    'ent-rahul': 'Primary Bridge • PID: P-001',
    'ent-rohan': 'Primary Bridge • PID: P-001',
    'ent-phone': '18 Calls • 9000010000',
    'ent-aman': '14 Calls • Amit Verma',
    'ent-sbi': 'FIN_001 • Loop Account',
    'ent-vikram': 'Suresh Patel / Mule',
    'ent-vehicle': '3 Sighting Logs • MP04AB1234',
    'ent-fir': 'FIR_001 • Bhopal Central',
    'ent-bhopal': 'Surveillance • New Market',
  };

  const getNodePos = (nodeId: string, index = 0, total = 8) => {
    if (nodePositions[nodeId]) {
      return nodePositions[nodeId];
    }
    const ext = EXTENDED_NODES.find((e) => e.id === nodeId);
    if (ext) {
      return { x: ext.x, y: ext.y };
    }
    const found = nodes.find((n) => n.id === nodeId);
    if (found && found.x && found.y) {
      return { x: found.x, y: found.y };
    }
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 470 + Math.cos(angle) * 260,
      y: 270 + Math.sin(angle) * 180,
    };
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.9));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.65));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Active edge details
  const activeEdge = useMemo(() => {
    return edges.find((e) => e.id === activeEdgeId) || edges[0];
  }, [edges, activeEdgeId]);

  // Render icons for node types
  const renderNodeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="w-4 h-4 text-slate-600" />;
      case 'account':
      case 'bank':
        return <Landmark className="w-4 h-4 text-slate-600" />;
      case 'vehicle':
        return <Car className="w-4 h-4 text-slate-600" />;
      case 'fir':
      case 'case':
        return <FileText className="w-4 h-4 text-slate-600" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-slate-600" />;
      case 'tower':
        return <Radio className="w-3.5 h-3.5 text-blue-600" />;
      case 'device':
        return <Smartphone className="w-3.5 h-3.5 text-slate-600" />;
      case 'company':
        return <Building className="w-3.5 h-3.5 text-slate-600" />;
      case 'toll':
        return <CreditCard className="w-3.5 h-3.5 text-amber-600" />;
      case 'person':
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  // Node category matcher for filters
  const matchesCategory = (type: string, category: string) => {
    if (category === 'all') return true;
    if (category === 'person') return type === 'person';
    if (category === 'phone') return type === 'phone' || type === 'device';
    if (category === 'account') return type === 'account' || type === 'bank' || type === 'company';
    if (category === 'vehicle') return type === 'vehicle' || type === 'toll';
    if (category === 'case') return type === 'fir' || type === 'case';
    if (category === 'location') return type === 'location' || type === 'tower';
    return true;
  };

  // Dynamic card content based on active edge
  const getCardDetails = () => {
    if (!activeEdge) return null;
    const isPhone = activeEdge.id === 'rel-trinetra-phone' || activeEdge.target === 'ent-phone' || activeEdge.source === 'ent-phone';
    const isSbi = activeEdge.id === 'rel-trinetra-sbi' || activeEdge.target === 'ent-sbi' || activeEdge.source === 'ent-sbi';
    const isVehicle = activeEdge.id === 'rel-trinetra-vehicle' || activeEdge.target === 'ent-vehicle' || activeEdge.source === 'ent-vehicle';
    const isFir = activeEdge.id === 'rel-trinetra-fir' || activeEdge.target === 'ent-fir' || activeEdge.source === 'ent-fir';
    const isBhopal = activeEdge.id === 'rel-trinetra-bhopal' || activeEdge.target === 'ent-bhopal' || activeEdge.source === 'ent-bhopal';
    const isAman = activeEdge.id === 'rel-trinetra-aman' || activeEdge.target === 'ent-aman' || activeEdge.source === 'ent-aman';
    const isVikram = activeEdge.id === 'rel-trinetra-vikram' || activeEdge.target === 'ent-vikram' || activeEdge.source === 'ent-vikram';

    if (isPhone) {
      return {
        title: 'Phone Call Relationship',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ 9000010000`,
        primaryMetricLabel: 'Burst Intercepts:',
        primaryMetricValue: '18 Calls (CDR_SPIKE_01)',
        dateRange: '09 Aug 2026 (140 mins)',
        direction: 'Multi-Party Burst',
        buttonText: 'View Call Records',
        action: onViewCallRecords,
      };
    }
    if (isSbi) {
      return {
        title: 'Financial Relationship',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ AC-001 (4567891201)`,
        primaryMetricLabel: 'Circular Tranches:',
        primaryMetricValue: 'FIN_001 (₹38,000 Volume)',
        dateRange: '05 Aug 2026 - 07 Aug 2026',
        direction: 'Loop Routing (AC-001 ↔ 002 ↔ 003)',
        buttonText: 'View Banking Ledger',
        action: onViewBankingLedger,
      };
    }
    if (isVehicle) {
      return {
        title: 'Vehicular Movement',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ MP04AB1234`,
        primaryMetricLabel: 'Logged Sighting Points:',
        primaryMetricValue: '3 Sightings (New Market & Sehore)',
        dateRange: '01 Aug 2026 - 09 Aug 2026',
        direction: 'Correlated Movements',
        buttonText: 'View ANPR & FASTag Logs',
        action: onViewVehicleLogs,
      };
    }
    if (isFir) {
      return {
        title: 'Police FIR Record',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ FIR_001`,
        primaryMetricLabel: 'Legal Status:',
        primaryMetricValue: 'Primary Bridge Entity',
        dateRange: '01 Aug 2026',
        direction: 'Police Incident Record',
        buttonText: 'View Police Case Document',
        action: onViewFirDocument,
      };
    }
    if (isBhopal) {
      return {
        title: 'Geographic Co-location',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ Bhopal Central`,
        primaryMetricLabel: 'Sightings / Locations:',
        primaryMetricValue: '4 Correlated Zones',
        dateRange: '01 Aug 2026 - 09 Aug 2026',
        direction: 'Transit Corridor',
        buttonText: 'View Geolocation Map',
        action: onViewLocationMap,
      };
    }
    if (isAman) {
      return {
        title: 'Associate Connection',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ Amit Verma`,
        primaryMetricLabel: 'Surveillance & Intercept:',
        primaryMetricValue: 'FIR_001 Meeting & Calls',
        dateRange: '01 Aug 2026 - 09 Aug 2026',
        direction: 'Direct Contact',
        buttonText: 'View Call Records',
        action: onViewCallRecords,
      };
    }
    if (isVikram) {
      return {
        title: 'Operational Contact',
        between: `${centerNode?.name || 'Rahul Sharma'} ↔ Suresh Patel / Vikram Singh`,
        primaryMetricLabel: 'Account & Network Link:',
        primaryMetricValue: 'FIN_001 Mule Return',
        dateRange: '02 Aug 2026 - 09 Aug 2026',
        direction: 'Network Associate',
        buttonText: 'View Call Records',
        action: onViewCallRecords,
      };
    }

    return {
      title: 'Entity Relationship',
      between: `${centerNode?.name || 'Rahul Sharma'} ↔ ${activeEdge.label}`,
      primaryMetricLabel: 'Relationship:',
      primaryMetricValue: activeEdge.label,
      dateRange: 'Active Case Scope',
      direction: 'Correlated Link',
      buttonText: 'View Details',
      action: onViewCallRecords,
    };
  };

  const cardDetails = getCardDetails();

  // Highlight logic for search
  const isSearchHit = (name: string) => {
    if (!searchQuery.trim()) return false;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Controls Toolbar: Filter Chips + Depth Mode + Quick Find */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Filters:
          </span>
          {[
            { id: 'all', label: 'All', count: depthMode === '1-hop' ? 8 : 14 },
            { id: 'person', label: 'People', count: depthMode === '1-hop' ? 3 : 4 },
            { id: 'phone', label: 'Phones', count: depthMode === '1-hop' ? 1 : 2 },
            { id: 'account', label: 'Accounts', count: depthMode === '1-hop' ? 1 : 3 },
            { id: 'vehicle', label: 'Vehicles', count: depthMode === '1-hop' ? 1 : 2 },
            { id: 'case', label: 'FIRs', count: 1 },
            { id: 'location', label: 'Locations', count: depthMode === '1-hop' ? 1 : 2 },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1 py-0.2 rounded text-[10px] ${
                  selectedCategory === cat.id
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Depth Selector + In-Canvas Search */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* In-Canvas Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Find entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 lg:w-44 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Depth Toggle: 1-Hop vs 2-Hop */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setDepthMode('1-hop')}
              title="View direct first-degree connections"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                depthMode === '1-hop'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Hop (Direct)
            </button>
            <button
              type="button"
              onClick={() => setDepthMode('2-hop')}
              title="View extended network intelligence"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                depthMode === '2-hop'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>2-Hop (Extended)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        id="graph-canvas-bg"
        className="relative w-full h-[520px] lg:h-[580px] bg-white overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Viewport Zoom & Fit Controls */}
        <div className="absolute top-4 left-4 z-20 flex flex-col bg-white border border-slate-200 rounded-lg shadow-2xs divide-y divide-slate-100">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-t-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset View"
            className="p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-b-lg transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Network Scope Badge (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs text-[11px] text-slate-600 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {depthMode === '1-hop' ? '8 Entities • 7 Correlated Edges' : '14 Entities • 13 Correlated Edges'}
          </span>
        </div>

        {/* SVG Canvas */}
        <svg
          className="w-full h-full"
          viewBox="0 0 940 540"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Sober, calm, architectural subtle dot pattern (spacious, not noisy or messy) */}
            <pattern
              id="cleanArchitectGrid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="18" cy="18" r="0.9" fill="#94a3b8" opacity="0.28" />
            </pattern>

            {/* Node drop shadow */}
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>

            {/* Center avatar clip path */}
            <clipPath id="avatarClipCircle">
              <circle cx="0" cy="0" r="28" />
            </clipPath>
          </defs>

          {/* Clean background canvas with sober dot pattern */}
          <rect width="100%" height="100%" fill="#ffffff" />
          <rect width="100%" height="100%" fill="url(#cleanArchitectGrid)" />

          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{
              transformOrigin: '470px 270px',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* 1. Extended 2-Hop Edges (if depthMode === '2-hop') */}
            {depthMode === '2-hop' &&
              EXTENDED_EDGES.map((eEdge) => {
                const sPos = getNodePos(eEdge.source);
                const tPos = getNodePos(eEdge.target);
                const isHighlighted = activeEdgeId === eEdge.id;

                const midX = (sPos.x + tPos.x) / 2;
                const midY = (sPos.y + tPos.y) / 2;
                const pillWidth = Math.max(60, eEdge.label.length * 6.8 + 16);

                return (
                  <g
                    key={eEdge.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEdgeId(eEdge.id);
                      setShowEdgeCard(true);
                    }}
                  >
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke="transparent"
                      strokeWidth={18}
                    />
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={isHighlighted ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isHighlighted ? 2 : 1.2}
                      strokeDasharray={eEdge.dashed ? '4 3' : 'none'}
                      className="transition-colors duration-150"
                    />
                    {/* Edge Label Pill */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-pillWidth / 2}
                        y="-9"
                        width={pillWidth}
                        height="18"
                        rx="9"
                        fill={isHighlighted ? '#eff6ff' : '#ffffff'}
                        stroke={isHighlighted ? '#2563eb' : '#e2e8f0'}
                        strokeWidth="1"
                        filter="url(#nodeShadow)"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={isHighlighted ? '#1d4ed8' : '#64748b'}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        className="pointer-events-none select-none"
                      >
                        {eEdge.label}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* 2. Core 1-Hop Connection Lines & Labels */}
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              // Filter out if category selected doesn't match
              const sMatch = matchesCategory(sourceNode.type, selectedCategory);
              const tMatch = matchesCategory(targetNode.type, selectedCategory);
              const isFaded = selectedCategory !== 'all' && !sMatch && !tMatch;

              const sPos = getNodePos(sourceNode.id);
              const tPos = getNodePos(targetNode.id);

              const isSelectedEdge = activeEdgeId === edge.id;
              const isPhoneEdge =
                edge.id === 'rel-trinetra-phone' ||
                (edge.source === 'ent-rohan' && edge.target === 'ent-phone');
              const isHighlighted = isSelectedEdge || (activeEdgeId === null && isPhoneEdge);

              // Midpoint for label
              const midX = (sPos.x + tPos.x) / 2;
              const midY = (sPos.y + tPos.y) / 2;
              const pillWidth = Math.max(68, edge.label.length * 7.2 + 20);

              return (
                <g
                  key={edge.id}
                  className={`cursor-pointer group ${isFaded ? 'opacity-25' : 'opacity-100'} transition-opacity duration-150`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveEdgeId(edge.id);
                    setShowEdgeCard(true);
                    if (onSelectEdge) onSelectEdge(edge);
                  }}
                >
                  <line
                    x1={sPos.x}
                    y1={sPos.y}
                    x2={tPos.x}
                    y2={tPos.y}
                    stroke="transparent"
                    strokeWidth={20}
                  />

                  {/* Visual Connection Line */}
                  <line
                    x1={sPos.x}
                    y1={sPos.y}
                    x2={tPos.x}
                    y2={tPos.y}
                    stroke={isHighlighted ? '#2563eb' : '#cbd5e1'}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    className="transition-colors duration-150"
                  />

                  {/* Relationship Label Pill */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-pillWidth / 2}
                      y="-11"
                      width={pillWidth}
                      height="22"
                      rx="11"
                      fill={isHighlighted ? '#eff6ff' : '#ffffff'}
                      stroke={isHighlighted ? '#2563eb' : '#e2e8f0'}
                      strokeWidth="1"
                      filter="url(#nodeShadow)"
                      className="transition-colors duration-150"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isHighlighted ? '#1d4ed8' : '#475569'}
                      fontSize="10"
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

            {/* 3. Extended 2-Hop Nodes (if depthMode === '2-hop') */}
            {depthMode === '2-hop' &&
              EXTENDED_NODES.map((extNode) => {
                const pos = { x: extNode.x, y: extNode.y };
                const isSelected = selectedNodeId === extNode.id;
                const isHit = isSearchHit(extNode.name);

                return (
                  <g
                    key={extNode.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find parent edge
                      const rel = EXTENDED_EDGES.find(
                        (r) => r.target === extNode.id || r.source === extNode.id
                      );
                      if (rel) {
                        setActiveEdgeId(rel.id);
                        setShowEdgeCard(true);
                      }
                    }}
                  >
                    <circle
                      r="19"
                      fill={isSelected ? '#eff6ff' : '#ffffff'}
                      stroke={isHit ? '#f59e0b' : isSelected ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isSelected || isHit ? '2' : '1.2'}
                      strokeDasharray="3 2"
                      filter="url(#nodeShadow)"
                      className="transition-all duration-150 group-hover:stroke-slate-500"
                    />
                    <foreignObject x="-10" y="-10" width="20" height="20">
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        {renderNodeIcon(extNode.type)}
                      </div>
                    </foreignObject>

                    {/* Extended Node Name */}
                    <text
                      x="0"
                      y="32"
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {extNode.name}
                    </text>

                    {/* Subtitle */}
                    <text
                      x="0"
                      y="43"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8.5"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {extNode.subtitle}
                    </text>
                  </g>
                );
              })}

            {/* 4. Surrounding 1st-Degree Connected Nodes */}
            {nodes
              .filter((n) => n.id !== 'ent-rohan')
              .map((node) => {
                const pos = getNodePos(node.id);
                const isSelected = selectedNodeId === node.id;
                const isHit = isSearchHit(node.name);
                const matches = matchesCategory(node.type, selectedCategory);
                const isFaded = selectedCategory !== 'all' && !matches;

                // Status indicator color
                const statusDotColor =
                  node.riskLevel === 'high'
                    ? '#ef4444'
                    : node.riskLevel === 'warning'
                    ? '#f59e0b'
                    : node.riskLevel === 'verified'
                    ? '#10b981'
                    : '#94a3b8';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className={`cursor-pointer group ${isFaded ? 'opacity-25' : 'opacity-100'} transition-opacity duration-150`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                      const relEdge = edges.find(
                        (edge) =>
                          (edge.source === node.id && edge.target === 'ent-rohan') ||
                          (edge.target === node.id && edge.source === 'ent-rohan')
                      );
                      if (relEdge) {
                        setActiveEdgeId(relEdge.id);
                        setShowEdgeCard(true);
                      }
                    }}
                  >
                    {/* Outer Circle with Shadow */}
                    <circle
                      r="23"
                      fill={isSelected ? '#eff6ff' : '#ffffff'}
                      stroke={isHit ? '#f59e0b' : isSelected ? '#2563eb' : '#e2e8f0'}
                      strokeWidth={isSelected || isHit ? '2.5' : '1.5'}
                      filter="url(#nodeShadow)"
                      className="transition-all duration-150 group-hover:stroke-slate-400"
                    />

                    {/* Risk / Status dot */}
                    <circle
                      cx="14"
                      cy="-14"
                      r="4.5"
                      fill={statusDotColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* Centered Node Icon */}
                    <foreignObject x="-12" y="-12" width="24" height="24">
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        {renderNodeIcon(node.type)}
                      </div>
                    </foreignObject>

                    {/* Primary Name Label Below Node */}
                    <text
                      x="0"
                      y="37"
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="11.5"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.name}
                    </text>

                    {/* Operational Subtitle Micro-tag */}
                    <text
                      x="0"
                      y="50"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9.5"
                      fontWeight="500"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {nodeSubtitles[node.id] || node.role || node.type}
                    </text>
                  </g>
                );
              })}

            {/* 5. Center Target Node: Rohan Mehta */}
            {centerNode && (
              <g
                transform={`translate(470, 270)`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(centerNode);
                }}
              >
                {/* Outer Blue Halo Glow Ring */}
                <circle
                  r="36"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="2.5"
                  opacity="0.8"
                />

                {/* White Background Circle with Shadow */}
                <circle
                  r="30"
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  filter="url(#nodeShadow)"
                />

                {/* Fallback Initials */}
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill="#2563eb"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  className="pointer-events-none select-none"
                >
                  RM
                </text>

                {/* Real Photo Avatar */}
                <image
                  href="/assets/rohan_mehta.jpg"
                  xlinkHref="/assets/rohan_mehta.jpg"
                  x="-28"
                  y="-28"
                  width="56"
                  height="56"
                  clipPath="url(#avatarClipCircle)"
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Primary High-Contrast Name Label Underneath */}
                <text
                  x="0"
                  y="48"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="12.5"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  className="pointer-events-none select-none"
                >
                  {centerNode.name}
                </text>

                {/* Operational Subtitle */}
                <text
                  x="0"
                  y="62"
                  textAnchor="middle"
                  fill="#2563eb"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  className="pointer-events-none select-none"
                >
                  Primary Target • P-1042
                </text>
              </g>
            )}
          </g>
        </svg>

        {/* Floating Relationship Detail Card (Matching Reference Screenshot) */}
        {showEdgeCard && cardDetails && (
          <div className="absolute top-4 right-4 z-20 w-72 sm:w-80 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-lg p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                {cardDetails.title}
              </h4>
              <button
                type="button"
                onClick={() => setShowEdgeCard(false)}
                title="Close Card"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 font-medium">Between:</span>
                <span className="text-slate-800 font-semibold text-right">
                  {cardDetails.between}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  {cardDetails.primaryMetricLabel}
                </span>
                <span className="text-slate-900 font-bold">
                  {cardDetails.primaryMetricValue}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Date Range:</span>
                <span className="text-slate-700 font-medium">
                  {cardDetails.dateRange}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Direction:</span>
                <span className="text-slate-700 font-medium">
                  {cardDetails.direction}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={cardDetails.action}
              className="w-full mt-3 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-semibold rounded-lg border border-slate-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{cardDetails.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Re-open Button if Card closed */}
        {!showEdgeCard && activeEdge && (
          <button
            type="button"
            onClick={() => setShowEdgeCard(true)}
            className="absolute top-4 right-4 z-20 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Show Link Details</span>
          </button>
        )}
      </div>
    </div>
  );
};
