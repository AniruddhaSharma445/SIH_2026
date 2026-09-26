import React, { useState, useEffect, useMemo } from 'react';
import { FileText, PhoneCall, Landmark, MapPin, Share2, Search as SearchIcon } from 'lucide-react';
import { api } from '../services/api';
import { TimelineEvent } from '../types';

const categoryStyles: Record<TimelineEvent['category'], { icon: React.ReactNode; color: string; dot: string }> = {
  FIR: { icon: <FileText className="w-4 h-4" />, color: 'text-slate-700 bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
  CDR: { icon: <PhoneCall className="w-4 h-4" />, color: 'text-[#a94e2c] bg-[#a94e2c]/10 border-[#a94e2c]/25', dot: 'bg-[#a94e2c]' },
  Financial: { icon: <Landmark className="w-4 h-4" />, color: 'text-[#3d6b53] bg-[#3d6b53]/10 border-[#3d6b53]/25', dot: 'bg-[#3d6b53]' },
  'Field Intel': { icon: <MapPin className="w-4 h-4" />, color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Network Analysis': { icon: <Share2 className="w-4 h-4" />, color: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
};

const statusStyles: Record<TimelineEvent['status'], string> = {
  Verified: 'bg-[#3d6b53]/10 text-[#3d6b53] border-[#3d6b53]/25',
  Flagged: 'bg-[#a94e2c]/10 text-[#a94e2c] border-[#a94e2c]/30',
  Analyzed: 'bg-slate-100 text-slate-600 border-slate-200',
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
};

interface TimelineViewProps {
  onInvestigateEntity?: (entityId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onInvestigateEntity }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getTimeline().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const categories = Array.from(new Set(events.map((e) => e.category)));

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const haystack = `${e.title} ${e.description} ${e.relatedEntityName || ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.stepNumber.localeCompare(b.stepNumber));
  }, [events, categoryFilter, query]);

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="text-xs text-[#726c5d] font-medium tracking-wide mb-1">
            Multi-Modal Evidence Feed
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Timeline &amp; Chronological Reconstruction
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, entities..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#f4f2ea] border border-[#ddd6c6] rounded-lg focus:outline-none focus:border-[#a94e2c]"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[#8a8471] uppercase tracking-wide mr-1">Category</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#182029] text-white border-[#182029]'
                : 'bg-white text-slate-600 border-[#ddd6c6] hover:bg-[#f4f2ea]'
            }`}
          >
            All Events
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                categoryFilter === c
                  ? 'bg-[#182029] text-white border-[#182029]'
                  : 'bg-white text-slate-600 border-[#ddd6c6] hover:bg-[#f4f2ea]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#8a8471]">Showing {filteredEvents.length} chronological exhibits</p>
      </div>

      {/* Vertical timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#a94e2c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl p-10 text-center text-sm text-slate-400">
          No timeline events match your filters.
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#ddd6c6]" />
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const style = categoryStyles[event.category];
              return (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-8 top-4 w-3 h-3 rounded-full ring-4 ring-[#faf8f4] ${style.dot}`} />
                  <div className="bg-[#fffefb] rounded-xl border border-[#ddd6c6] p-4 shadow-2xs">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.color}`}>
                          {style.icon}
                          {event.category}
                        </span>
                        <span className="text-[11px] text-[#8a8471] font-mono">
                          Step {event.stepNumber} · {event.date}
                          {event.time ? ` · ${event.time}` : ''}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[event.status]}`}>
                        {event.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{event.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{event.description}</p>

                    {event.relatedEntityName && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e8e2d4]">
                        <span className="text-[11px] text-slate-500">
                          Entities: <span className="font-semibold text-slate-700">{event.relatedEntityName}</span>
                        </span>
                        {event.relatedEntityId && onInvestigateEntity && (
                          <button
                            onClick={() => onInvestigateEntity(event.relatedEntityId!)}
                            className="text-[11px] font-semibold text-[#a94e2c] hover:text-[#8f4124] cursor-pointer"
                          >
                            Inspect →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
