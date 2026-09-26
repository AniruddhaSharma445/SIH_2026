import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, ShieldAlert, Info, Search, ArrowRight, Clock } from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';

const SEVERITIES: { key: AlertItem['severity'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All Severities' },
  { key: 'high', label: 'High' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
];

const severityStyles: Record<AlertItem['severity'], { badge: string; icon: React.ReactNode; ring: string }> = {
  high: {
    badge: 'bg-[#a94e2c]/10 text-[#a94e2c] border-[#a94e2c]/30',
    icon: <ShieldAlert className="w-4 h-4 text-[#a94e2c]" />,
    ring: 'border-l-4 border-l-[#a94e2c]',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    ring: 'border-l-4 border-l-amber-500',
  },
  info: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <Info className="w-4 h-4 text-slate-500" />,
    ring: 'border-l-4 border-l-slate-400',
  },
};

interface AlertsViewProps {
  onInvestigateEntity?: (entityId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onInvestigateEntity }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<AlertItem['severity'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

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

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="text-xs text-[#726c5d] font-medium tracking-wide mb-1">Cases / All Alerts</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Alerts</h1>
        </div>
        <div className="text-xs text-[#726c5d]">
          {filteredAlerts.length} of {alerts.length} alerts shown
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts, entities, cases..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#f4f2ea] border border-[#ddd6c6] rounded-lg focus:outline-none focus:border-[#a94e2c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#8a8471] uppercase tracking-wide mr-1">Severity</span>
            {SEVERITIES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeverityFilter(s.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  severityFilter === s.key
                    ? 'bg-[#182029] text-white border-[#182029]'
                    : 'bg-white text-slate-600 border-[#ddd6c6] hover:bg-[#f4f2ea]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {alertTypes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-[#8a8471] uppercase tracking-wide mr-1">Type</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-[#182029] text-white border-[#182029]'
                    : 'bg-white text-slate-600 border-[#ddd6c6] hover:bg-[#f4f2ea]'
                }`}
              >
                All
              </button>
              {alertTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#182029] text-white border-[#182029]'
                      : 'bg-white text-slate-600 border-[#ddd6c6] hover:bg-[#f4f2ea]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#a94e2c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl p-10 text-center text-sm text-slate-400">
          No alerts match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const style = severityStyles[alert.severity];
            return (
              <div
                key={alert.id}
                className={`bg-[#fffefb] rounded-xl border border-[#ddd6c6] ${style.ring} p-4 shadow-2xs flex items-start justify-between gap-4`}
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
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8a8471]">
                      <span className="font-mono font-semibold">{alert.caseNumber}</span>
                      {alert.entityName && <span>Entity: {alert.entityName}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {alert.entityId && onInvestigateEntity && (
                  <button
                    onClick={() => onInvestigateEntity(alert.entityId!)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#a94e2c] bg-[#a94e2c]/10 hover:bg-[#a94e2c]/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
