import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Search,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem, Investigation } from '../types';

const SEVERITIES: { key: AlertItem['severity'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All Severities' },
  { key: 'high', label: 'High' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
];

const severityStyles: Record<AlertItem['severity'], { badge: string; icon: React.ReactNode; ring: string }> = {
  high: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
    ring: 'border-l-4 border-l-rose-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    ring: 'border-l-4 border-l-amber-500',
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Info className="w-4 h-4 text-blue-600" />,
    ring: 'border-l-4 border-l-blue-500',
  },
};

export const Alerts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseParam = searchParams.get('case');

  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseParam || '');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState<AlertItem['severity'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  // Load case list once
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

  // Load alerts scoped to the selected case
  useEffect(() => {
    if (!selectedCaseId) return;
    setLoading(true);
    api.getAlerts(selectedCaseId).then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, [selectedCaseId]);

  const alertTypes = useMemo(() => {
    const types = new Set<string>();
    alerts.forEach((a) => a.alertType && types.add(a.alertType));
    return Array.from(types);
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && a.alertType !== typeFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = `${a.title} ${a.message} ${a.entityName || ''} ${a.caseNumber}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, typeFilter, query]);

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  const handleCaseChange = (id: string) => {
    setSelectedCaseId(id);
    const params = new URLSearchParams(searchParams);
    params.set('case', id);
    navigate(`/alerts?${params.toString()}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Alerts</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            {activeCase
              ? `Flagged activity for ${activeCase.caseNumber} — ${activeCase.title}`
              : 'Flagged activity and risk signals'}
          </p>
        </div>

        {/* Case selector */}
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
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts, entities, cases..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Severity</span>
            {SEVERITIES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeverityFilter(s.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  severityFilter === s.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {alertTypes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Type</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {alertTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    typeFilter === t
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          No alerts match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const style = severityStyles[alert.severity];
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border border-slate-200 ${style.ring} p-4 shadow-xs flex items-start justify-between gap-4`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">{style.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.alertType && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {alert.alertType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="font-mono font-semibold text-slate-500">{alert.caseNumber}</span>
                      {alert.entityName && <span>Entity: {alert.entityName}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/network?case=${encodeURIComponent(selectedCaseId)}${
                        alert.entityId ? `&highlight=${encodeURIComponent(alert.entityId)}` : ''
                      }`
                    )
                  }
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <span>Investigate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
