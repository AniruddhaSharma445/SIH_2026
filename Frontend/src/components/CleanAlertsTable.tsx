import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { AlertItem } from '../types';

interface CleanAlertsTableProps {
  alerts: AlertItem[];
  onViewAlert: (alert: AlertItem) => void;
  onViewAll?: () => void;
}

export const CleanAlertsTable: React.FC<CleanAlertsTableProps> = ({
  alerts,
  onViewAlert,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent Alerts
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Clean Table matching reference screenshot */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Alert ID</th>
              <th className="py-3 px-6">Type</th>
              <th className="py-3 px-6">Entity</th>
              <th className="py-3 px-6">Reason</th>
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Risk</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {alerts.slice(0, 4).map((alert) => {
              const riskLevel = alert.risk || (alert.severity === 'high' ? 'High' : 'Medium');
              const isHigh = riskLevel === 'High';

              return (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Alert ID */}
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    {alert.id}
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-6 text-slate-700 font-medium">
                    {alert.alertType || alert.title}
                  </td>

                  {/* Entity */}
                  <td className="py-3.5 px-6 text-slate-900 font-medium">
                    {alert.entity || alert.entityName || alert.caseNumber}
                  </td>

                  {/* Reason */}
                  <td className="py-3.5 px-6 text-slate-500">
                    {alert.reason || alert.message}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap">
                    {alert.date || alert.timestamp}
                  </td>

                  {/* Risk Badge */}
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isHigh
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {riskLevel}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => onViewAlert(alert)}
                      className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
