import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FolderGit2, Shield, Search } from 'lucide-react';

interface AnveshakNavbarProps {
  activeTab: 'Overview' | 'People' | 'Connections' | 'Alerts' | 'Documents';
  onTabChange: (tab: 'Overview' | 'People' | 'Connections' | 'Alerts' | 'Documents') => void;
  currentCase: string;
  onCaseChange?: (caseName: string) => void;
  onOpenSearch?: () => void;
}

export const AnveshakNavbar: React.FC<AnveshakNavbarProps> = ({
  activeTab,
  onTabChange,
  currentCase = 'Case 24/2026 • Nagpur',
  onCaseChange,
  onOpenSearch,
}) => {
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs: Array<'Overview' | 'People' | 'Connections' | 'Alerts' | 'Documents'> = [
    'Overview',
    'People',
    'Connections',
    'Alerts',
    'Documents',
  ];

  const availableCases = [
    {
      id: 'case-24-2026',
      title: 'FIR_001 • Bhopal Central',
      subtitle: 'New Market Transit & Inter-District Network',
      status: 'Active Investigation',
      target: 'Rahul Sharma Network',
    },
    {
      id: 'inv-trinetra',
      title: 'INV-2026-014 • Operation Trinetra',
      subtitle: 'Bhopal Shell Accounts & Hawala Tranche Loop',
      status: 'Charge Sheet Stage',
      target: 'Rahul Sharma Syndicate',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-[#19222b] text-white border-b border-[#242f3a] select-none sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Diamond Logo + ANVESHAK + Nav Tabs */}
        <div className="flex items-center gap-6 sm:gap-8 h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onTabChange('Overview')}
          >
            {/* Terracotta/Orange Diamond */}
            <span className="text-[#e05a38] text-base leading-none group-hover:scale-110 transition-transform">
              ◆
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-[0.18em] text-white uppercase leading-none">
                ANVESHAK
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Intelligence Platform
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-5 w-[1px] bg-[#2a3745]" />

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 sm:gap-6 h-full text-xs font-medium">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`relative h-full flex items-center transition-colors px-1 cursor-pointer ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#e05a38] rounded-t-xs" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Search + Case Selector + User Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Trigger */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-[#232d37] hover:bg-[#2c3845] border border-[#2f3c49] rounded-md text-xs text-slate-300 font-medium transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search docket...</span>
              <kbd className="px-1.5 py-0.5 bg-[#19222b] text-[10px] text-slate-400 rounded border border-[#374452]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Case Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setCaseMenuOpen(!caseMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25303c] hover:bg-[#2e3b48] border border-[#344150] rounded-md text-xs text-slate-200 font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{currentCase}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {caseMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-76 bg-[#1f2933] border border-[#344250] rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#2d3a47]">
                  Assigned Case Files
                </div>
                <div className="mt-1 space-y-1">
                  {availableCases.map((c) => {
                    const isSelected = currentCase.includes(c.title.split(' • ')[0]);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (onCaseChange) onCaseChange(c.title);
                          setCaseMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#2a3644] text-white'
                            : 'hover:bg-[#25303c] text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{c.title}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#e05a38]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.subtitle}</p>
                          <span className="inline-block mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            {c.target}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div
            className="flex items-center gap-2 pl-1 cursor-pointer"
            title="Investigator R. Sharma • CID Crime Branch"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#b8533c] text-white text-xs font-bold flex items-center justify-center shadow-2xs border border-[#cf6851]">
                RS
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#19222b]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
