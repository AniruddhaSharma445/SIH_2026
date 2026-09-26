import React from 'react';
import { X, Phone, Clock, Radio, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface CallRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName?: string;
  phoneNumber?: string;
}

export const CallRecordsModal: React.FC<CallRecordsModalProps> = ({
  isOpen,
  onClose,
  entityName = 'Rahul Sharma',
  phoneNumber = '+91 90000 10000',
}) => {
  if (!isOpen) return null;

  const isAmit = entityName.toLowerCase().includes('amit');
  const activePhone = isAmit ? '+91 90000 10001' : phoneNumber;
  const targetContact = isAmit ? 'Rahul Sharma (+91 90000 10000)' : 'Amit Verma / Suresh Patel';

  const records = [
    {
      id: 'cdr-001',
      time: '09 Aug 2026, 14:02',
      duration: '4m 12s',
      direction: 'Outgoing',
      tower: 'New Market Hub (BPL-BTS-01)',
      imei: '864201049281920',
      status: 'Completed',
    },
    {
      id: 'cdr-002',
      time: '09 Aug 2026, 14:18',
      duration: '1m 45s',
      direction: 'Incoming',
      tower: 'New Market Hub (BPL-BTS-01)',
      imei: '864201049281920',
      status: 'Completed',
    },
    {
      id: 'cdr-003',
      time: '09 Aug 2026, 14:40',
      duration: '6m 30s',
      direction: 'Outgoing',
      tower: 'Habibganj Transit (BPL-BTS-03)',
      imei: '864201049281920',
      status: 'Completed',
    },
    {
      id: 'cdr-004',
      time: '09 Aug 2026, 15:15',
      duration: '2m 10s',
      direction: 'Incoming',
      tower: 'Sehore Road Outer (BPL-BTS-07)',
      imei: '864201049281920',
      status: 'Completed',
    },
    {
      id: 'cdr-005',
      time: '09 Aug 2026, 16:12',
      duration: '5m 04s',
      direction: 'Outgoing',
      tower: 'MP Nagar Central (BPL-BTS-04)',
      imei: '864201049281920',
      status: 'Completed',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Call Detail Records (CDR_SPIKE_01)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {entityName} ({activePhone}) ↔ {targetContact} • 18 Burst Intercepts (140 mins)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Total Recorded Calls</span>
              <span className="text-slate-900 font-bold text-sm">18 Calls (Spike)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Cumulative Duration</span>
              <span className="text-slate-900 font-bold text-sm">48m 12s</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Tower Correlation</span>
              <span className="text-emerald-600 font-bold text-sm">High (96% Co-located)</span>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Time &amp; Date</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Tower Cell ID</th>
                <th className="py-2.5 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-medium text-slate-800">{r.time}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                        r.direction === 'Outgoing' ? 'text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      {r.direction === 'Outgoing' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                      {r.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{r.duration}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{r.tower}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-semibold text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Source: Telecom Carrier Lawful Ingestion Gateway (MP Telecom Circle)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
