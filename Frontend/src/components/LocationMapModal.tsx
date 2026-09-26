import React from 'react';
import { X, MapPin, Radio, Compass, ShieldCheck } from 'lucide-react';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName?: string;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  locationName = 'Bhopal, Madhya Pradesh',
}) => {
  if (!isOpen) return null;

  const sightings = [
    {
      id: 'LOC-01',
      date: '09 Aug 2026, 14:02',
      type: 'Cell Tower Triangulation (CDR_SPIKE_01)',
      spot: 'New Market Hub BTS (BPL-BTS-01)',
      entity: 'Rahul Sharma (+91 90000 10000)',
      confidence: 'High (3 Towers Correlated)',
    },
    {
      id: 'LOC-02',
      date: '01 Aug 2026, 11:15',
      type: 'ANPR Camera Sighting',
      spot: 'New Market TT Nagar Checkpost',
      entity: 'MP04AB1234 (Mahindra Scorpio)',
      confidence: '99.6% License Plate OCR',
    },
    {
      id: 'LOC-03',
      date: '05 Aug 2026, 10:45',
      type: 'Bank Branch Terminal IP',
      spot: 'SBI Bhopal Central Branch',
      entity: 'AC-001 (Rahul Sharma) Transfer ₹18,500',
      confidence: 'Core Banking Gateway IP',
    },
    {
      id: 'LOC-04',
      date: '03 Aug 2026, 16:20',
      type: 'Correlated Sighting (FIR_003)',
      spot: 'Sehore Road Outer Highway',
      entity: 'Rahul Sharma & Neeraj Khan (MP04EF9012)',
      confidence: 'Surveillance Corroborated',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Geographic Co-location & Tower Triangulation
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {locationName} • 6 Correlated Event Points in Investigation Scope
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Visual Schematic Map Representation (Clean SVG Grid) */}
          <div className="h-44 w-full bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="gridMap" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridMap)" />
            </svg>

            {/* Radar / Tower concentric rings */}
            <div className="absolute w-40 h-40 rounded-full border border-blue-500/20 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute w-28 h-28 rounded-full border border-blue-400/30" />
            <div className="absolute w-16 h-16 rounded-full border border-blue-400/50" />

            {/* Simulated Triangulation Nodes */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <span className="mt-1.5 px-2 py-0.5 rounded bg-slate-800/90 text-white font-mono text-[10px] font-semibold border border-slate-700">
                Focal Zone: Bhopal Central (23.2599° N, 77.4126° E)
              </span>
            </div>

            {/* Pin 1: TT Nagar */}
            <div className="absolute top-8 left-1/4 flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>TT Nagar (ATM/Bank)</span>
            </div>

            {/* Pin 2: Bypass */}
            <div className="absolute bottom-6 right-1/4 flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Bypass Toll (Vehicle)</span>
            </div>
          </div>

          {/* Triangulation logs */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
              Chronological Location Logs
            </h4>
            <div className="space-y-2">
              {sightings.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-900">
                        {s.id}
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {s.spot}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Linked: <strong className="text-slate-700">{s.entity}</strong> • {s.type}
                    </p>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <span className="text-slate-500 font-medium block">
                      {s.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-[10px] mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      {s.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Telecom Tower Triangulation Accuracy: ±80m Circular Error Probable (CEP)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
