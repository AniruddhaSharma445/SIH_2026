import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Search,
  Share2,
  FolderClosed,
  Bell,
  FileText,
  Triangle,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navItems = [
    { name: 'Workspace', path: '/', icon: LayoutGrid },
    { name: 'Search', path: '/network?search=true', icon: Search },
    { name: 'Network', path: '/network', icon: Share2 },
    { name: 'Cases', path: '/investigations', icon: FolderClosed },
    { name: 'Alerts', path: '/?tab=alerts', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col justify-between w-60 h-screen bg-[#0e1726] border-r border-slate-800/80 text-slate-300 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div>
          <div className="px-6 py-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <Triangle className="w-4 h-4 fill-current rotate-0" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wider text-white leading-tight">
                  ANVESHAK
                </h1>
                <p className="text-[11px] font-normal tracking-normal text-slate-400 mt-0.5">
                  Connecting the Unseen
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Slogan */}
        <div className="p-6 border-t border-slate-800/50">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Data
          </p>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Connects
          </p>
          <p className="text-xs text-slate-300 font-semibold tracking-wide">
            The Dots.
          </p>
        </div>
      </aside>
    </>
  );
};
