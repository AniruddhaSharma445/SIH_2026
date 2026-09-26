import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileText,
  GitFork,
  HelpCircle,
  X,
} from 'lucide-react';

export type WorkspaceViewMode = 'overview' | 'investigate' | 'system' | 'upload' | 'documents' | 'connections';

interface AnveshakSidebarProps {
  activeView: WorkspaceViewMode;
  onSelectView: (view: WorkspaceViewMode) => void;
  selectedEntityId?: string;
  onSelectEntity?: (entityId: string) => void;
  currentCase: string;
  onSelectCase: (caseName: string) => void;
  onOpenGuidelines: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AnveshakSidebar: React.FC<AnveshakSidebarProps> = ({
  activeView,
  onSelectView,
  currentCase,
  onSelectCase,
  onOpenGuidelines,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const casesList = [
    { id: '24/2026', name: '24/2026 · Nagpur', status: 'Active' as const, date: '11 Sep 2026' },
    { id: '19/2026', name: '19/2026 · Raipur', status: 'Active' as const, date: '04 Sep 2026' },
    { id: '31/2025', name: '31/2025 · Bhandara', status: 'Closed' as const, date: '18 Nov 2025' },
  ];

  const handleNavClick = (view: WorkspaceViewMode) => {
    onSelectView(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#182029] text-[#cfd3d8] flex flex-col p-4 border-r border-white/10 overflow-y-auto transition-transform duration-200 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 lg:hidden mb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Navigation</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Brand Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-3">
          <div className="w-3 h-3 bg-[#a94e2c] rotate-45 shrink-0 shadow-xs" />
          <div>
            <div className="font-serif font-bold text-base text-white tracking-wide">
              ANVESHAK
            </div>
            <div className="text-[10px] text-[#7b8695] tracking-wider uppercase">
              Criminal Network Analysis
            </div>
          </div>
        </div>

        {/* 2. Working Case Pill */}
        <div className="bg-white/6 border border-white/10 rounded-lg p-2.5 mb-3">
          <div className="text-[9.5px] uppercase tracking-wider text-[#8891a0] font-bold">
            Working Case
          </div>
          <div className="text-xs font-bold text-[#f1ede4] mt-0.5">{currentCase}</div>
          <div className="text-[10px] text-[#7b8695] mt-1 flex items-center justify-between">
            <span>Last reviewed 11 Sep 2026</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
          </div>
        </div>

        {/* 3. Workspace Navigation (Case Overview & Investigate) */}
        <nav className="space-y-1 mb-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6d7684] font-bold px-1 mb-1">
            Workspace
          </div>

          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-[#a94e2c]/20 text-white border border-[#a94e2c]/40'
                : 'text-[#c3c8ce] hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 ${
                activeView === 'overview' ? 'text-[#a94e2c]' : 'opacity-80'
              }`}
            />
            <span>Case Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('investigate')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'investigate'
                ? 'bg-[#a94e2c]/20 text-white border border-[#a94e2c]/40'
                : 'text-[#c3c8ce] hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 ${
                activeView === 'investigate' ? 'text-[#a94e2c]' : 'opacity-80'
              }`}
            />
            <span>Investigate</span>
          </button>

          {/* 4. Documents & Maps */}
          <div className="text-[10px] uppercase tracking-wider text-[#6d7684] font-bold px-1 pt-2 mb-1">
            Documents &amp; Maps
          </div>

          <button
            type="button"
            onClick={() => handleNavClick('documents')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'documents'
                ? 'bg-[#a94e2c]/20 text-white border border-[#a94e2c]/40'
                : 'text-[#c3c8ce] hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <FileText
              className={`w-4 h-4 shrink-0 ${
                activeView === 'documents' ? 'text-[#a94e2c]' : 'opacity-80'
              }`}
            />
            <span>Case Documents</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('connections')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'connections'
                ? 'bg-[#a94e2c]/20 text-white border border-[#a94e2c]/40'
                : 'text-[#c3c8ce] hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <GitFork
              className={`w-4 h-4 shrink-0 ${
                activeView === 'connections' ? 'text-[#a94e2c]' : 'opacity-80'
              }`}
            />
            <span>Connections Map</span>
          </button>
        </nav>

        {/* 5. Team on this Case */}
        <div className="mb-3 px-1">
          <div className="text-[10px] uppercase tracking-wider text-[#6d7684] font-bold mb-1.5">
            Team on this Case
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div
                title="Riya Sen (Lead Investigator)"
                className="w-6 h-6 rounded-full bg-[#212b37] border-2 border-[#182029] text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs"
              >
                RS
              </div>
              <div
                title="Aman Joshi (Financial Analyst)"
                className="w-6 h-6 rounded-full bg-[#212b37] border-2 border-[#182029] text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs"
              >
                AJ
              </div>
              <div
                title="Kavita Nair (Telecom Specialist)"
                className="w-6 h-6 rounded-full bg-[#212b37] border-2 border-[#182029] text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs"
              >
                KN
              </div>
            </div>
            <span className="text-[11px] text-[#7b8695]">3 officers assigned</span>
          </div>
        </div>

        {/* 6. My Cases List at Bottom */}
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6d7684] font-bold px-1 mb-1.5 flex items-center justify-between">
            <span>My Cases</span>
            <span className="text-[9.5px] text-[#7b8695]">Switch Case</span>
          </div>
          <div className="space-y-1">
            {casesList.map((c) => {
              const isActive = currentCase.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCase(c.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-[#9aa2ac] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
                      c.status === 'Active'
                        ? 'bg-[#3d6b53]/30 text-[#8fd6ab]'
                        : 'bg-white/10 text-[#7b8695]'
                    }`}
                  >
                    {c.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Sidebar Footer */}
        <div className="mt-auto pt-3 border-t border-white/10 text-[11px] text-[#6d7684] space-y-2">
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-semibold text-[#b7bcc3] hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#a94e2c] shrink-0" />
            <span>Help &amp; Investigator Guidelines</span>
          </button>

          <p className="text-[10px] leading-relaxed text-[#7b8695] px-1">
            Protected under Case 24/2026 judicial access controls. Every lead requires human verification before action.
          </p>

          <div className="text-[9.5px] text-[#5f6773] px-1 pt-1 border-t border-white/5 flex items-center justify-between">
            <span>Anveshak v0.4</span>
            <span className="text-[#8fd6ab]">Encrypted Session</span>
          </div>
        </div>
      </aside>
    </>
  );
};
