import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Menu,
  X,
  ExternalLink,
  AlertTriangle,
  Info,
  Folder,
  ChevronDown,
  User,
  Sliders,
  Settings as SettingsIcon,
  LogOut,
  Shield,
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation, Entity, AlertItem } from '../types';
import { EntityBadge } from './EntityBadge';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    cases: Investigation[];
    entities: Entity[];
  }>({ cases: [], entities: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCaseTitle, setSelectedCaseTitle] = useState('Operation Trinetra');
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const caseMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAlerts().then(setAlerts);
    api.getInvestigations().then((res) => {
      setCases(res);
      if (res.length > 0) {
        setSelectedCaseTitle(res[0].title);
      }
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ cases: [], entities: [] });
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(searchQuery);
        setSearchResults(res);
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        alertsRef.current &&
        !alertsRef.current.contains(e.target as Node)
      ) {
        setAlertsOpen(false);
      }
      if (
        caseMenuRef.current &&
        !caseMenuRef.current.contains(e.target as Node)
      ) {
        setCaseMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200">
      {/* Left: Mobile trigger & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Prominent Search Field matching reference */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setSearchOpen(true);
              }}
              placeholder="Search people, phone numbers, accounts, vehicles or case IDs..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-200/80 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {isSearching ? (
                <div className="p-4 text-xs text-slate-500 text-center">
                  Searching intelligence index...
                </div>
              ) : searchResults.cases.length === 0 &&
                searchResults.entities.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 text-center">
                  No matching cases or entities found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.cases.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Investigations
                      </p>
                      {searchResults.cases.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            navigate(`/investigations/${c.id}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs group"
                        >
                          <div>
                            <span className="font-semibold text-blue-700 mr-2">
                              {c.caseNumber}
                            </span>
                            <span className="text-slate-800 font-medium">
                              {c.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.entities.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Entities &amp; Nodes
                      </p>
                      {searchResults.entities.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => {
                            navigate(`/network?highlight=${e.id}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <EntityBadge type={e.type} size="sm" />
                            <div>
                              <span className="font-semibold text-slate-900">
                                {e.name}
                              </span>
                              {e.identifier && (
                                <span className="ml-1.5 text-slate-500 text-[11px]">
                                  ({e.identifier})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                            View in Graph →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Operation Dropdown + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 pl-3">
        {/* Operation Selector Dropdown */}
        <div ref={caseMenuRef} className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setCaseMenuOpen(!caseMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Folder className="w-3.5 h-3.5 text-slate-600" />
            <span>{selectedCaseTitle}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {caseMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50">
              <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Operation
              </p>
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseTitle(c.title);
                    setCaseMenuOpen(false);
                    navigate('/');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    selectedCaseTitle === c.title
                      ? 'font-bold text-blue-600 bg-blue-50/50'
                      : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{c.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {c.caseNumber}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Action (+ icon in place of bell icon) */}
        <button
          type="button"
          id="topbar-upload-btn"
          onClick={() => navigate('/?view=upload')}
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer"
          title="Upload Data & Evidence"
          aria-label="Upload page"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* User / Investigator Profile Area with Attached Mini-Table Dropdown */}
        <div ref={userMenuRef} className="relative pl-2 sm:pl-3 border-l border-slate-200">
          <button
            type="button"
            id="topbar-user-profile-button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer focus:outline-hidden"
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider ring-1 ring-slate-200">
              AT
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                <span>Aditya Tiwari</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight">
                Investigator
              </p>
            </div>
          </button>

          {/* Attached Mini Table Pop-up */}
          {userMenuOpen && (
            <div
              id="topbar-user-dropdown"
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    AT
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">Aditya Tiwari</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium truncate">Lead Field Investigator</p>
                    <p className="text-[10px] text-slate-400 truncate">ID: #IND-9021</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group cursor-pointer"
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
                        Investigator credentials &amp; badge
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 px-1.5 py-0.5 bg-slate-100 rounded">
                    View
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/case-workspace');
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group cursor-pointer"
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
                        Team &amp; case dossiers
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Roster
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group cursor-pointer"
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
                        Security &amp; system parameters
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 px-1.5 py-0.5 bg-slate-100 rounded">
                    Config
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/');
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
                        End active session
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded">
                    Exit
                  </span>
                </button>
              </div>

              <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Clearance Level 3
                </span>
                <span className="font-mono text-slate-400 text-[9px]">ID: #9021</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
