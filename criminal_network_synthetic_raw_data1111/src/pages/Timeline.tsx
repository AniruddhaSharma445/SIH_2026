import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  PhoneCall,
  Landmark,
  MapPin,
  Share2,
  CheckCircle2,
  Flag,
  Search as SearchIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { TimelineEvent, Investigation } from '../types';

const categoryStyles: Record<TimelineEvent['category'], { icon: React.ReactNode; color: string; dot: string }> = {
  FIR: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  CDR: { icon: <PhoneCall className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  Financial: { icon: <Landmark className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'Field Intel': { icon: <MapPin className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Network Analysis': { icon: <Share2 className="w-4 h-4" />, color: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
};

const statusStyles: Record<TimelineEvent['status'], string> = {
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Flagged: 'bg-rose-50 text-rose-700 border-rose-200',
  Analyzed: 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
};

export const Timeline: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseParam = searchParams.get('case');

  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseParam || '');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getInvestigations().then((list) => {
      setCases(list);
      if (!caseParam && list.length > 0) {
        setSelectedCaseId(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (caseParam) setSelectedCaseId(caseParam);
  }, [caseParam]);

  useEffect(() => {
    if (!selectedCaseId) return;
    setLoading(true);
    api.getTimeline(selectedCaseId).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [selectedCaseId]);

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

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  const handleCaseChange = (id: string) => {
    setSelectedCaseId(id);
    const params = new URLSearchParams(searchParams);
    params.set('case', id);
    navigate(`/timeline?${params.toString()}`);
  };

  const categories = Array.from(new Set(events.map((e) => e.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
            <span>Multi-Modal Evidence Feed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Timeline &amp; Chronological Reconstruction
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            {activeCase
              ? `Reconstructing ${activeCase.caseNumber} — ${activeCase.title}`
              : 'Reconstruct how the case unfolded, event by event'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">Case:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => handleCaseChange(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title.slice(0, 26)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, entities..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Category</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Events
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                categoryFilter === c
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">Showing {filteredEvents.length} chronological exhibits</p>
      </div>

      {/* Vertical timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          No timeline events match your filters.
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const style = categoryStyles[event.category];
              return (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-8 top-4 w-3 h-3 rounded-full ring-4 ring-white ${style.dot}`} />
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.color}`}>
                          {style.icon}
                          {event.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
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
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">
                          Entities: <span className="font-semibold text-slate-700">{event.relatedEntityName}</span>
                        </span>
                        {event.relatedEntityId && (
                          <button
                            onClick={() =>
                              navigate(
                                `/network?case=${encodeURIComponent(selectedCaseId)}&highlight=${encodeURIComponent(
                                  event.relatedEntityId!
                                )}`
                              )
                            }
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
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
