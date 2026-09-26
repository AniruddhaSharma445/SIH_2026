import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnveshakSidebar, WorkspaceViewMode } from '../components/AnveshakSidebar';
import { EditorialMetricsBar } from '../components/EditorialMetricsBar';
import { EditorialEntitiesList } from '../components/EditorialEntitiesList';
import { EditorialRelationshipView } from '../components/EditorialRelationshipView';
import {
  EditorialConnectionsView,
  EditorialDocumentsView,
} from '../components/EditorialOtherTabs';
import { DatabaseUploadSection } from '../components/DatabaseUploadSection';
import { InvestigateView, ENTITY_DATABASE } from '../components/InvestigateView';
import {
  Search,
  Plus,
  Menu,
  X,
  User,
  Landmark,
  Truck,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  ArrowLeft,
  Sliders,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  BadgeCheck,
  ChevronRight,
  Lock,
  Building2,
  Mail,
  Phone,
  Users,
  Check,
} from 'lucide-react';

interface ResolutionPair {
  id: string;
  a: string;
  b: string;
  conf: number;
  action: 'merge' | 'review';
  resolved?: boolean;
}

const INITIAL_QUEUE: ResolutionPair[] = [
  { id: 'q1', a: '"A. Rathore" — FIR_098', b: '"Arjun Rathore" — TXN_44S1', conf: 0.91, action: 'merge' },
  { id: 'q2', a: '"Arjun Bhai" — CDR_1182', b: '"Arjun Rathore" — FIR_098', conf: 0.84, action: 'merge' },
  { id: 'q3', a: '"R. Verma" — CDR_0231', b: '"Rohan Verma" — FIR_102', conf: 0.58, action: 'review' },
  { id: 'q4', a: '"V. Patil" — TXN_2210', b: '"Vikram Patil" — CDR_0871', conf: 0.88, action: 'merge' },
  { id: 'q5', a: '"S. Khan" — FIR_071', b: '"Sameer Khan" — LOC_014', conf: 0.62, action: 'review' },
  { id: 'q6', a: '"Rathore Transport" — TXN_2091', b: '"Rathore Transport Services" — FIR_098', conf: 0.95, action: 'merge' },
];

export const CaseWorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialView: WorkspaceViewMode =
    searchParams.get('tab') === 'upload' ||
    searchParams.get('view') === 'upload' ||
    searchParams.get('view') === 'system'
      ? 'upload'
      : 'overview';
  const [activeView, setActiveView] = useState<WorkspaceViewMode>(initialView);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('arjun');
  const [currentCase, setCurrentCase] = useState<string>('24/2026 · Nagpur');
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);

  // Sync if URL search params change
  useEffect(() => {
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    if (viewParam === 'upload' || viewParam === 'system') {
      setActiveView('upload');
    }
  }, [searchParams]);

  // Global search modal (Command Palette)
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mobile sidebar drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Investigator Guidelines Modal state
  const [guidelinesModalOpen, setGuidelinesModalOpen] = useState<boolean>(false);

  // User Profile Dropdown & Modal state
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [activeUserModal, setActiveUserModal] = useState<'profile' | 'manage' | 'settings' | 'logout' | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState<boolean>(false);
  const [newOfficerName, setNewOfficerName] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState([
    { name: 'Riya Sen', role: 'Lead Investigator', clearance: 'Level 4 · Full Access', status: 'Active' },
    { name: 'Aman Joshi', role: 'Financial Crime Analyst', clearance: 'Level 3 · Bank Ledgers', status: 'Active' },
    { name: 'Kavita Nair', role: 'Telecom & RF Specialist', clearance: 'Level 3 · CDR & Towers', status: 'Active' },
  ]);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Click outside to close user menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Entity Resolution Queue State
  const [resolutionQueue, setResolutionQueue] = useState<ResolutionPair[]>(INITIAL_QUEUE);

  // Keyboard shortcut listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setGuidelinesModalOpen(false);
        setUserMenuOpen(false);
        setActiveUserModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResolvePair = (id: string) => {
    setResolutionQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
    );
  };

  const pendingResolutionCount = resolutionQueue.filter((q) => !q.resolved).length;

  const searchableItems = [
    { id: 'arjun', name: 'Arjun Rathore', type: 'person', role: 'Prime bridge entity & coordinator' },
    { id: 'rathore_transport', name: 'Rathore Transport Services', type: 'organization', role: 'Fleet owner MCA #8401' },
    { id: 'meera', name: 'Meera Kulkarni', type: 'person', role: 'Named in FIR_102 • phone interaction' },
    { id: 'vikram', name: 'Vikram Patil', type: 'person', role: '₹6.2L pass-through account transfer' },
    { id: 'sameer', name: 'Sameer Khan', type: 'person', role: 'Fleet transport driver • Bhandara corridor' },
    { id: 'priya', name: 'Priya Deshmukh', type: 'person', role: 'Call logs • 3 shared contacts' },
    { id: 'rohan', name: 'Rohan Verma', type: 'person', role: 'Warehouse premises hit • CCTNS match' },
    { id: 'sbi_acct', name: 'SBI A/C ...9981', type: 'financial', role: 'Intermediary mule account' },
  ];

  const filteredSearch = searchableItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEntityInOverview = (id: string) => {
    // Normalise ID if prefixed with ent-
    const cleanId = id.replace('ent-', '').replace('-', '_');
    setSelectedEntityId(cleanId);
  };

  const handleSelectEntityForInvestigation = (id: string) => {
    // Normalise ID if prefixed with ent-
    const cleanId = id.replace('ent-', '').replace('-', '_');
    setSelectedEntityId(cleanId);
    setActiveView('investigate');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#20201b] flex font-sans antialiased">
      {/* 1. Improved Left-Side Navbar / Sidebar (Req 3 & Req 5) */}
      <AnveshakSidebar
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        selectedEntityId={selectedEntityId}
        onSelectEntity={(id) => handleSelectEntityForInvestigation(id)}
        currentCase={currentCase}
        onSelectCase={(c) => setCurrentCase(c)}
        onOpenGuidelines={() => setGuidelinesModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#fffefb]/95 backdrop-blur-md border-b border-[#ddd6c6] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-2xs transition-colors duration-200">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg border border-[#ddd6c6] text-slate-700 hover:bg-[#ede9df] lg:hidden cursor-pointer"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar with Autocomplete dropdown trigger */}
          <div className="flex-1 max-w-md relative">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-[#f4f2ea] hover:bg-[#ede9df] border border-[#ddd6c6] rounded-lg text-xs text-slate-700 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Search people, aliases, accounts, locations…</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white border border-[#ddd6c6] rounded text-[10px] font-mono text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Topbar Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* View switcher shortcut indicator */}
            {activeView !== 'overview' && (
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2ea] hover:bg-[#ede9df] text-slate-800 text-xs font-bold rounded-lg border border-[#ddd6c6] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#a94e2c]" />
                <span>Case Overview</span>
              </button>
            )}

            {/* Upload Page Action (+ icon in place of bell icon) */}
            <button
              type="button"
              id="topbar-upload-btn"
              onClick={() => setActiveView('upload')}
              title="Upload Data & Evidence"
              aria-label="Upload Data & Evidence"
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                activeView === 'upload' || activeView === 'system'
                  ? 'bg-[#a94e2c] text-white border-[#a94e2c]'
                  : 'border-[#ddd6c6] bg-white hover:bg-[#f4f2ea] text-slate-700 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* User Profile Avatar with Attached Mini-Table Popup */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                id="user-profile-menu-button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 pl-1 p-1 rounded-xl transition-all cursor-pointer text-left focus:outline-hidden ${
                  userMenuOpen
                    ? 'bg-[#ede9df] ring-2 ring-[#a94e2c]/30'
                    : 'hover:bg-[#f4f2ea]'
                }`}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User Profile & Quick Actions Menu"
                title="Riya Sen · Lead Investigator (Click to open menu)"
              >
                <div
                  className="w-9 h-9 rounded-full bg-[#a94e2c] text-white text-xs font-bold flex items-center justify-center shadow-xs select-none ring-2 ring-white"
                >
                  RS
                </div>
                <div className="hidden xl:block text-left pr-1">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                    <span>Riya Sen</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" title="Active on duty" />
                  </div>
                  <div className="text-[10px] text-slate-500">Lead Investigator</div>
                </div>
              </button>

              {/* Attached Mini-Table Pop-up */}
              {userMenuOpen && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-[#ddd6c6] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Investigator Info Header */}
                  <div className="p-3.5 bg-[#faf8f4] border-b border-[#e8e2d4]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#a94e2c] text-white font-bold text-sm flex items-center justify-center shadow-xs select-none shrink-0 ring-2 ring-white">
                        RS
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">Riya Sen</h4>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3d6b53]/15 text-[#3d6b53]">
                            <span className="w-1 h-1 rounded-full bg-[#3d6b53]" />
                            On Duty
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a94e2c] font-semibold truncate">Lead Investigator</p>
                        <p className="text-[10px] text-slate-500 truncate">Badge #IND-8842 · Nagpur Cyber</p>
                      </div>
                    </div>
                  </div>

                  {/* Options Mini Table */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {/* 1. Profile */}
                    <button
                      type="button"
                      id="user-menu-profile-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveUserModal('profile');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#faf8f4] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-700 transition-colors">
                            Profile
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Investigator dossier &amp; credentials
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 px-1.5 py-0.5 bg-slate-100 rounded">
                        View
                      </span>
                    </button>

                    {/* 2. Manage */}
                    <button
                      type="button"
                      id="user-menu-manage-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveUserModal('manage');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#faf8f4] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                          <Sliders className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-700 transition-colors">
                            Manage
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Case allocations &amp; team access
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        3 Officers
                      </span>
                    </button>

                    {/* 3. Settings */}
                    <button
                      type="button"
                      id="user-menu-settings-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveUserModal('settings');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#faf8f4] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                          <SettingsIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-slate-900 transition-colors">
                            Settings
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Intelligence thresholds &amp; alerts
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 px-1.5 py-0.5 bg-slate-100 rounded">
                        Config
                      </span>
                    </button>

                    {/* 4. Logout */}
                    <button
                      type="button"
                      id="user-menu-logout-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveUserModal('logout');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-rose-50/70 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-rose-700 block">
                            Logout
                          </span>
                          <span className="text-[10px] text-rose-500 block">
                            Lock session &amp; secure workspace
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded">
                        Lock
                      </span>
                    </button>
                  </div>

                  {/* Footer Clearance Indicator */}
                  <div className="px-3.5 py-2 bg-[#faf8f4] border-t border-[#e8e2d4] flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Clearance Level 4 (Wiretap &amp; CCTNS)
                    </span>
                    <span className="font-mono text-slate-400 text-[9px]">ID: #8842</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. Dynamic Page View Container */}
        <main className="flex-1 p-4 sm:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* ===================== VIEW: CASE OVERVIEW ===================== */}
          {activeView === 'overview' && (
            <div className="space-y-5">
              {/* Page Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-[#726c5d] font-medium tracking-wide mb-1">
                    Cases / {currentCase}
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Case Workspace
                  </h1>
                </div>
                <div className="text-xs text-[#726c5d] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3d6b53]" />
                  <span>Last reviewed 11 Sep 2026</span>
                </div>
              </div>

              {/* Stats Bar */}
              <EditorialMetricsBar
                activeMetricFilter={activeMetricFilter}
                onSelectMetricFilter={(id) => setActiveMetricFilter(id)}
              />

              {/* 2-Column Grid: Entities of Interest (Left) & Relationship View (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left Column (4 cols): Entities of Interest */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col min-h-[520px]">
                  <EditorialEntitiesList
                    selectedEntityId={'ent-' + selectedEntityId.replace('_', '-')}
                    onSelectEntity={(id) => handleSelectEntityInOverview(id)}
                    statusFilterOverride={
                      activeMetricFilter === 'review' ? 'Needs review' : null
                    }
                  />
                </div>

                {/* Right Column (7 cols): Relationship View with Zoom & Drag */}
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col min-h-[520px]">
                  <EditorialRelationshipView
                    selectedEntityId={'ent-' + selectedEntityId.replace('_', '-')}
                    onSelectEntity={(id) => handleSelectEntityInOverview(id)}
                    onInvestigateEntity={(id) => handleSelectEntityForInvestigation(id)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW: INVESTIGATE (Req 4 & Req 5) ===================== */}
          {activeView === 'investigate' && (
            <div className="space-y-4">
              <InvestigateView
                selectedEntityId={selectedEntityId}
                onSelectEntity={(id) => setSelectedEntityId(id)}
                onBackToOverview={() => setActiveView('overview')}
              />
            </div>
          )}

          {/* ===================== VIEW: UPLOAD & CASE DATABASE ===================== */}
          {(activeView === 'upload' || activeView === 'system') && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-[#726c5d] font-medium tracking-wide mb-1">
                    Case {currentCase} / Ingestion
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Database Upload &amp; Evidence Ingestion
                  </h1>
                </div>
                <div className="text-xs text-[#726c5d] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3d6b53]" />
                  <span>4 sources connected • {pendingResolutionCount} entity pairs awaiting resolution</span>
                </div>
              </div>

              {/* Source Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">FIR / Case Records</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">62</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    Processed &amp; Extracted
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Call Detail Records (CDR)</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">941</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    Processed &amp; Triangulated
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#a94e2c] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Financial Transactions</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">318</div>
                  <div className="text-[11px] text-[#8a3e21] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a94e2c] animate-pulse" />
                    Processing Bank Tranches
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Location &amp; Telemetry</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">27</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    ANPR Hits Correlated
                  </div>
                </div>
              </div>

              {/* Combined Database Ingestion & Entity Resolution Workspace */}
              <DatabaseUploadSection
                resolutionQueue={resolutionQueue}
                onResolvePair={handleResolvePair}
              />
            </div>
          )}

          {/* ===================== VIEW: DOCUMENTS ===================== */}
          {activeView === 'documents' && (
            <div className="space-y-4">
              <EditorialDocumentsView />
            </div>
          )}

          {/* ===================== VIEW: CONNECTIONS ===================== */}
          {activeView === 'connections' && (
            <div className="space-y-4">
              <EditorialConnectionsView />
            </div>
          )}
        </main>
      </div>

      {/* 4. Global Quick Search Modal (Command Palette via ⌘K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-2xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#ddd6c6] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-[#e5e0d8] flex items-center gap-3 bg-[#faf9f6]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type any person name, alias, account, or legal filing..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#f2efe9] p-1">
              {filteredSearch.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No records match "{searchQuery}"
                </div>
              ) : (
                filteredSearch.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleSelectEntityForInvestigation(item.id);
                      setSearchModalOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-[#faf7f2] rounded-lg cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#f4f1eb] flex items-center justify-center shrink-0 border border-[#e5e0d8]">
                        {item.type === 'person' && <User className="w-3.5 h-3.5 text-slate-500" />}
                        {item.type === 'financial' && <Landmark className="w-3.5 h-3.5 text-amber-600" />}
                        {item.type === 'vehicle' && <Truck className="w-3.5 h-3.5 text-emerald-600" />}
                        {item.type === 'organization' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#a94e2c] transition-colors truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.role}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#a94e2c] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#f8f6f2] border-t border-[#e5e0d8] flex items-center justify-between text-[11px] text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-[#ddd6c6] rounded text-[10px] text-slate-500">ESC</kbd> to close</span>
              <span>Click to investigate immediately</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Help & Investigator Guidelines Modal */}
      {guidelinesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fffefb] rounded-xl shadow-2xl border border-[#ddd6c6] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#a94e2c]" />
                <h3 className="font-serif text-sm font-bold text-slate-900">
                  Help &amp; Investigator Guidelines
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuidelinesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-[#f5f3ec] rounded-lg border border-[#ddd6c6]">
                <strong className="text-slate-900 block mb-1">Human-in-the-Loop Verification Mandate:</strong>
                ANVESHAK surfaces multi-source cross-correlations and anomaly spikes automatically. However, all topological connections remain intelligence leads until validated and marked reviewed by an authorized officer.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Confidence Scoring Calibration:</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>Strong Link (&ge; 0.85):</strong> Multiple corroborated sources (e.g. CDR tower triangulations matching banking NEFT beneficiary).</li>
                  <li><strong>Moderate Link (0.70 &ndash; 0.84):</strong> Corroborated single source with repeated frequency.</li>
                  <li><strong>Weak Link (&lt; 0.70):</strong> Unconfirmed lead, single name match, or address overlap.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Evidence Docket Standards:</h4>
                <p className="text-slate-600">
                  All ingested FIR charge sheets, CDR CSV logs, and banking ledgers are stored under SHA-256 hash chains compliant with Section 65B of the Indian Evidence Act.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf8f4] border-t border-[#e8e2d4] flex justify-end">
              <button
                type="button"
                onClick={() => setGuidelinesModalOpen(false)}
                className="px-4 py-1.5 bg-[#182029] hover:bg-[#212b37] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. User Option: Profile Modal */}
      {activeUserModal === 'profile' && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fffefb] rounded-xl shadow-2xl border border-[#ddd6c6] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900">
                    Investigator Profile &amp; Dossier
                  </h3>
                  <p className="text-[10px] text-slate-500">Official Police Identification &amp; Credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Officer Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#182029] to-[#253241] text-white flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#a94e2c] text-white font-serif font-bold text-xl flex items-center justify-center shrink-0 ring-4 ring-white/10">
                  RS
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-bold text-white">Riya Sen</h4>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Clearance L-4
                    </span>
                  </div>
                  <p className="text-xs text-[#ddd6c6] font-medium mt-0.5">Senior Inspector · Lead Criminal Network Analyst</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-[#a94e2c]" />
                    Badge #IND-8842 · Nagpur Cyber Crime Police Station
                  </p>
                </div>
              </div>

              {/* Credential Data Table */}
              <div className="border border-[#e8e2d4] rounded-lg overflow-hidden bg-white">
                <div className="bg-[#faf8f4] px-3.5 py-2 border-b border-[#e8e2d4] font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                  Service Record &amp; Access Rights
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50 w-36">Department</td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-semibold">Cyber &amp; Financial Crimes Special Operations</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50">Jurisdiction</td>
                      <td className="py-2.5 px-3.5 text-slate-900">Nagpur Zone &amp; Inter-State Corridors (Maharashtra)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50">Email (Gov)</td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-mono text-[11px]">riya.sen@police.gov.in</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50">Phone</td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-mono text-[11px]">+91 712-256-4401 (Ext: 84)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50">Current Inquiry</td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-semibold">Case 24/2026 · Prime Lead Officer</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 bg-slate-50/50">Legal Mandate</td>
                      <td className="py-2.5 px-3.5 text-slate-700 text-[11px]">Authorized for Section 65B Electronic Certificates &amp; CCTNS Triangulations</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf8f4] border-t border-[#e8e2d4] flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Authenticated via Central Police PKI</span>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="px-4 py-1.5 bg-[#182029] hover:bg-[#212b37] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. User Option: Manage Modal */}
      {activeUserModal === 'manage' && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fffefb] rounded-xl shadow-2xl border border-[#ddd6c6] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900">
                    Manage Case Allocations &amp; Team Roster
                  </h3>
                  <p className="text-[10px] text-slate-500">Case 24/2026 · Personnel &amp; Audit Permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-[#faf8f4] border border-[#e8e2d4] rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Investigation Dossier 24/2026</div>
                  <div className="text-[11px] text-slate-500">Corridor: Nagpur &ndash; Raipur &ndash; Bilaspur Inter-State Network</div>
                </div>
                <span className="px-2 py-0.5 bg-[#3d6b53]/20 text-[#3d6b53] font-bold text-[10px] rounded-full">
                  Active Investigation
                </span>
              </div>

              {/* Team Members List */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span>Assigned Officers ({teamMembers.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">All officers log actions under audit trail</span>
                </h4>

                <div className="border border-[#e8e2d4] rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#faf8f4] text-slate-600 border-b border-[#e8e2d4] font-semibold text-[10.5px]">
                        <th className="py-2 px-3">Officer</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Access Level</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamMembers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">
                              {m.name.split(' ').map(n => n[0]).join('')}
                            </span>
                            <span>{m.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{m.role}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{m.clearance}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Officer Section */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Assign Additional Officer / Analyst
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    placeholder="e.g. Inspector Sunil Sharma (Forensics)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newOfficerName.trim()) {
                        setTeamMembers((prev) => [
                          ...prev,
                          {
                            name: newOfficerName.trim(),
                            role: 'Intelligence Analyst',
                            clearance: 'Level 2 · Evidence Read',
                            status: 'Active',
                          },
                        ]);
                        setNewOfficerName('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#a94e2c] hover:bg-[#8f4124] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf8f4] border-t border-[#e8e2d4] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="px-4 py-1.5 bg-[#182029] hover:bg-[#212b37] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. User Option: Settings Modal */}
      {activeUserModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fffefb] rounded-xl shadow-2xl border border-[#ddd6c6] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900">
                    Investigation Settings &amp; Thresholds
                  </h3>
                  <p className="text-[10px] text-slate-500">Heuristic Alert Triggers &amp; Compliance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {settingsSavedNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Investigation parameters updated and saved for this session.
                </div>
              )}

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Topological Centrality Cutoff</span>
                    <span className="font-mono text-xs font-bold text-[#a94e2c]">0.75</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Entities with betweenness or degree centrality exceeding 0.75 are flagged as Prime Bridge nodes.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#a94e2c] focus:ring-0" />
                    <span>Automated CDR Spike Anomaly Detection</span>
                  </label>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Triggers high-priority alerts when call volume between unverified IMSIs spikes &gt; 3x baseline.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#a94e2c] focus:ring-0" />
                    <span>Financial Round-Trip Mule Account Flagging</span>
                  </label>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Identifies circular fund flow loops within 48 hours across separate bank branches.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#a94e2c] focus:ring-0" />
                    <span>Section 65B SHA-256 Chain Verification</span>
                  </label>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Ensures cryptographic immutability for all ingested electronic exhibits and telecom logs.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf8f4] border-t border-[#e8e2d4] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSettingsSavedNotice(true);
                  setTimeout(() => {
                    setSettingsSavedNotice(false);
                    setActiveUserModal(null);
                  }, 1200);
                }}
                className="px-4 py-1.5 bg-[#a94e2c] hover:bg-[#8f4124] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. User Option: Logout / Lock Confirmation Modal */}
      {activeUserModal === 'logout' && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fffefb] rounded-xl shadow-2xl border border-[#ddd6c6] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900">
                    Lock Investigation Workspace
                  </h3>
                  <p className="text-[10px] text-slate-500">Riya Sen · Badge #IND-8842</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Are you sure you want to lock the active session for <strong>Case 24/2026 · Nagpur</strong>?
              </p>
              <div className="p-3 bg-[#f5f3ec] rounded-lg border border-[#ddd6c6] text-[11px] text-slate-700">
                All resolved entity matches, graph filters, and newly ingested evidence records will remain safely cached and encrypted.
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf8f4] border-t border-[#e8e2d4] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveUserModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveUserModal(null);
                  setIsSessionLocked(true);
                }}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Lock Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Locked Session Overlay (When logged out / locked) */}
      {isSessionLocked && (
        <div className="fixed inset-0 z-50 bg-[#182029]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#fffefb] rounded-2xl shadow-2xl border border-[#ddd6c6] max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#a94e2c]/15 text-[#a94e2c] flex items-center justify-center mx-auto ring-8 ring-[#a94e2c]/5">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Workspace Session Locked
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Investigator: <strong>Riya Sen</strong> (Badge #IND-8842)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active Case: 24/2026 · Nagpur Range
              </p>
            </div>

            <div className="p-3 bg-[#faf8f4] border border-[#e8e2d4] rounded-lg text-xs text-slate-600">
              Session is encrypted under Section 65B judicial protection.
            </div>

            <button
              type="button"
              onClick={() => setIsSessionLocked(false)}
              className="w-full py-2.5 bg-[#a94e2c] hover:bg-[#8f4124] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Resume Session as Riya Sen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
