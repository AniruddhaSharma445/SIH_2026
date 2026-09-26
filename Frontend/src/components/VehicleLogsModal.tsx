import React from 'react';
import { X, Car, ShieldCheck, MapPin, Calendar, Camera } from 'lucide-react';

interface VehicleLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber?: string;
  vehicleModel?: string;
}

export const VehicleLogsModal: React.FC<VehicleLogsModalProps> = ({
  isOpen,
  onClose,
  plateNumber = 'MP04AB1234',
  vehicleModel = 'Mahindra Scorpio (Black)',
}) => {
  if (!isOpen) return null;

  const logs = [
    {
      id: 'ANPR-BPL-001',
      date: '01 Aug 2026, 11:15',
      toll: 'New Market TT Nagar Checkpost',
      direction: 'Inbound to New Market Plaza',
      fastagId: 'TAG3401928301',
      cameraMatch: 'Plate Match 99.6% • ANPR Camera 01-A',
      driverPhoto: 'Driver identified as Rahul Sharma; parked near MP04CD5678',
    },
    {
      id: 'ANPR-BPL-003',
      date: '03 Aug 2026, 16:20',
      toll: 'Sehore Road Highway Plaza',
      direction: 'Outbound towards Sehore Bypass',
      fastagId: 'TAG3401928301',
      cameraMatch: 'Plate Match 98.9% • CCTNS Grid Feed',
      driverPhoto: 'Spotted within 10 min window of Neeraj Khan (MP04EF9012)',
    },
    {
      id: 'ANPR-BPL-009',
      date: '09 Aug 2026, 14:35',
      toll: 'Habibganj Transit Axis (Lane 02)',
      direction: 'Inbound to Central Transit Junction',
      fastagId: 'TAG3401928301',
      cameraMatch: 'Plate Match 99.2% • RFID Toll Sensor B',
      driverPhoto: 'Coincides with CDR_SPIKE_01 multi-party call burst',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                FASTag & ANPR Vehicle Sighting Logs
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {plateNumber} • {vehicleModel} • RTO Bhopal MP-04
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Registered Custodian</span>
              <span className="text-slate-900 font-bold text-sm">Rahul Sharma (P-001)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Key Associates Correlated</span>
              <span className="text-slate-900 font-bold text-sm">Amit Verma & Neeraj Khan</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">FASTag Wallet State</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active • Linked to AC-001
              </span>
            </div>
          </div>

          {/* Sightings List */}
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/20 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                      {log.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {log.toll}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {log.date}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium">
                  {log.direction}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3 text-blue-600" />
                    {log.cameraMatch}
                  </span>
                  <span className="text-slate-600">
                    {log.driverPhoto}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Integrated with National Highway Authority (NHAI) & Bhopal Police ANPR Grid</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
