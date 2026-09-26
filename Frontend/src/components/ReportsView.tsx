import React, { useState } from 'react';
import { 
  FileText, 
  Network, 
  Landmark, 
  Download, 
  Image as ImageIcon, 
  FileBox, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

// Initial mock data based on Case 24/2026 prototype context
const INITIAL_REPORTS = [
  {
    id: 'rep-01',
    title: 'Case 24/2026 — Comprehensive Dossier v1',
    type: 'FULL_DOSSIER',
    typeLabel: 'Full Case Summary',
    pages: '45 pp',
    date: '11 Sep 2026, 14:30 IST',
    status: 'Verified',
  },
  {
    id: 'rep-02',
    title: 'Bhopal Syndicate — Suspect Network Graph',
    type: 'GRAPH_EXTRACT',
    typeLabel: 'Graph Extraction',
    pages: '1 pp',
    date: '08 Sep 2026, 09:15 IST',
    status: 'Verified',
  },
  {
    id: 'rep-03',
    title: 'Circular Flow Analysis (Rahul Sharma to AC-001)',
    type: 'FIN_AUDIT',
    typeLabel: 'Financial Audit',
    pages: '12 pp',
    date: '07 Aug 2026, 18:45 IST',
    status: 'Verified',
  },
];

export const ReportsView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'full' | 'graph' | 'financial'>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const reportTypes = [
    {
      id: 'full',
      icon: FileBox,
      title: 'Comprehensive Case Dossier',
      description: 'All entities, cross-referenced events, network topology, and high-priority alerts.',
      tag: 'FULL_DOSSIER'
    },
    {
      id: 'graph',
      icon: Network,
      title: 'Topological Graph Extraction',
      description: 'High-res graph visualization with centrality metrics and bridge nodes (e.g., Rahul Sharma).',
      tag: 'GRAPH_EXTRACT'
    },
    {
      id: 'financial',
      icon: Landmark,
      title: 'Financial Flow & Mule Audit',
      description: 'Section 65B compliant ledger extraction, round-trip trails, and CDR overlaps.',
      tag: 'FIN_AUDIT'
    },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate generation delay for interactivity
    setTimeout(() => {
      const activeType = reportTypes.find(t => t.id === selectedType);
      
      const newReport = {
        id: `rep-new-${Date.now()}`,
        title: `Case 24/2026 — Generated ${activeType?.title}`,
        type: activeType?.tag || 'REPORT',
        typeLabel: activeType?.title.split(' ')[0] + ' Report' || 'Report',
        pages: selectedType === 'graph' ? '1 pp' : (selectedType === 'full' ? '48 pp' : '15 pp'),
        date: new Date().toLocaleString('en-IN', { 
          day: '2-digit', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: false 
        }) + ' IST',
        status: 'Just Now',
      };

      setReports([newReport, ...reports]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Generate Report Controls */}
      <div className="bg-[#fffefb] rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-[#ece8df]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">
                Generate Official Case Report
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Compile a court-ready, Section 65B compliant PDF report detailing the evidentiary pipeline for Case 24/2026. Select a report focus below to customize the output format for judicial affidavits or senior briefings.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button 
                type="button"
                className="px-4 py-2 bg-[#f4f2ea] hover:bg-[#ede9df] border border-[#ddd6c6] text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Export Graph PNG
              </button>
              <button 
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2 bg-[#a94e2c] hover:bg-[#8f4124] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[160px] justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate PDF Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selection Cards */}
        <div className="p-6 md:p-8 bg-[#faf8f4]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected 
                      ? 'border-[#a94e2c] bg-white ring-1 ring-[#a94e2c] shadow-md' 
                      : 'border-[#ddd6c6] bg-[#fffefb] hover:border-slate-400 hover:shadow-sm'
                  }`}
                >
                  {/* Subtle background icon for design depth */}
                  <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] ${isSelected ? 'text-[#a94e2c]' : 'text-slate-900'}`} />
                  
                  <div className={`w-8 h-8 rounded-lg mb-4 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#a94e2c] text-white' : 'bg-[#f4f2ea] text-slate-600 border border-[#ddd6c6] group-hover:text-slate-900'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <h3 className={`text-sm font-bold mb-1.5 transition-colors ${isSelected ? 'text-[#a94e2c]' : 'text-slate-900'}`}>
                    {type.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Generated Reports Table */}
      <div className="bg-[#fffefb] rounded-xl border border-[#e5e0d8] shadow-2xs overflow-hidden">
        <div className="px-6 py-5 border-b border-[#ece8df]">
          <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">
            Generated Reports Archive
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed outputs for Case 24/2026.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#ece8df] text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Report Title</th>
                <th className="py-3.5 px-6">Classification</th>
                <th className="py-3.5 px-6">Pages</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9] text-slate-700">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#faf8f4] transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#a94e2c] transition-colors" />
                      <span className="font-bold text-slate-900">{report.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-500">
                    {report.pages}
                  </td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap flex flex-col gap-0.5">
                    <span>{report.date}</span>
                    {report.status === 'Just Now' ? (
                      <span className="text-[10px] font-bold text-[#a94e2c] animate-pulse">New Generation</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {report.status}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      type="button" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f2ea] border border-[#ddd6c6] text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
