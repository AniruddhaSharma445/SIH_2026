import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ReportItem } from '../types';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getReports().then(setReports);
  }, []);

  const handleGenerate = async (report: ReportItem) => {
    try {
      setGeneratingId(report.id);
      const updated = await api.generateReport(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, ...updated } : r))
      );
      setFeedbackNotice(`Report "${report.title}" regenerated with latest graph topology.`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err) {
      console.error('Failed to generate report', err);
      setFeedbackNotice(`Failed to generate "${report.title}".`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleExport = (report: ReportItem) => {
    setFeedbackNotice(`Exporting "${report.title}" (${report.fileSize} PDF dossier)...`);
    setTimeout(() => {
      setFeedbackNotice(`Download completed: ${report.caseNumber}_${report.type.replace(/\s+/g, '_')}.pdf`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Investigation Reports &amp; Dossiers
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Standardized evidentiary dossiers, network topology extracts, and pattern detection briefs
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeedbackNotice('All case dossiers scheduled for batch archive.');
            setTimeout(() => setFeedbackNotice(null), 3000);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export All Dossiers (ZIP)</span>
        </button>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-blue-700 hover:text-blue-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {report.caseNumber}
                </span>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {report.status}
                </span>
              </div>

              {/* Title & Type */}
              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                {report.title}
              </h3>
              <p className="text-xs font-semibold text-purple-700 mb-2.5">
                {report.type}
              </p>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {report.description}
              </p>

              {/* Metadata strip */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs mb-4">
                <div>
                  <span className="block text-[10px] text-slate-400">Pages</span>
                  <strong className="text-slate-800">{report.pages}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">File Size</span>
                  <strong className="text-slate-800">{report.fileSize}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Compiler</span>
                  <strong className="text-slate-800 truncate block">
                    {report.generatedBy}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons: View, Generate, Export */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveReport(report)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>View</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerate(report)}
                  disabled={generatingId === report.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-500 ${
                      generatingId === report.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{generatingId === report.id ? 'Generating...' : 'Generate'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport(report)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report View Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeReport.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Case: {activeReport.caseNumber} • Generated on {activeReport.generatedDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Document Simulation Preview */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>CONFIDENTIAL INVESTIGATION DOSSIER</span>
                  <span>DOC_REF: ANV-{activeReport.id.toUpperCase()}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {activeReport.title}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {activeReport.description}
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
                  Executive Analytical Extract
                </h5>
                <p className="leading-relaxed">
                  The ANVESHAK graph resolution engine parsed 48,920 call detail records, 8,640 financial transfers, and 1,284 FIR entries. Through topological cluster resolution, three separate operational silos were resolved into a single coordinated network with 94.2% entity match confidence.
                </p>

                <h5 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
                  Key Graph Topological Metrics
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Identified 1 bridge entity (Rahul Sharma) between communications and financial extraction layers.</li>
                  <li>Detected 1 circular money flow pattern routing ₹18.5 Lakhs through 3 intermediary accounts.</li>
                  <li>Correlated cell tower triangulation with FASTag toll gate handshakes within 90 seconds.</li>
                </ul>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Investigator Protocol:</strong> This report represents automated pattern analysis for prosecutorial preparation and field coordination. Verification of electronic evidence under Section 65B of Indian Evidence Act required before judicial submission.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {activeReport.pages} pages • {activeReport.fileSize}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExport(activeReport);
                    setActiveReport(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
