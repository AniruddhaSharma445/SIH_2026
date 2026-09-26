import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  UploadCloud,
  FileText,
  Table,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  Database,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  GitMerge,
} from 'lucide-react';

export interface DatabaseRecordFile {
  id: string;
  name: string;
  category: 'FIR / Case Records' | 'Call Detail Records (CDR)' | 'Financial Transactions' | 'Location & Telemetry';
  fileSize: string;
  recordsCount: number;
  uploadedAt: string;
  status: 'Processed' | 'Processing' | 'Pending Review';
  sourceCode: 'FIR' | 'CDR' | 'FIN' | 'LOC';
}

export interface ResolutionPair {
  id: string;
  a: string;
  b: string;
  conf: number;
  action: 'merge' | 'review';
  resolved?: boolean;
}

const DEFAULT_RESOLUTION_QUEUE: ResolutionPair[] = [
  { id: 'q-1', a: 'CDR: +91 98201 22341', b: 'FIN: Shell Acc #4091', conf: 0.94, action: 'merge' },
  { id: 'q-2', a: 'FIR: Arjun Rathore', b: 'CDR: +91 94221 88902', conf: 0.88, action: 'merge' },
  { id: 'q-3', a: 'LOC: Toll Plaza B-14', b: 'VEH: MH-31-EQ-9921', conf: 0.79, action: 'review' },
  { id: 'q-4', a: 'FIN: Nagpur Logistics Corp', b: 'FIR: Shell Hub B-4', conf: 0.82, action: 'review' },
];

const INITIAL_FILES: DatabaseRecordFile[] = [
  {
    id: 'db-1',
    name: 'FIR_Case_102_Crime_Branch_Nagpur.pdf',
    category: 'FIR / Case Records',
    fileSize: '2.4 MB',
    recordsCount: 62,
    uploadedAt: '11 Sep 2026, 09:30',
    status: 'Processed',
    sourceCode: 'FIR',
  },
  {
    id: 'db-2',
    name: 'CDR_Bilateral_Nagpur_Bhandara_44S1.csv',
    category: 'Call Detail Records (CDR)',
    fileSize: '4.1 MB',
    recordsCount: 941,
    uploadedAt: '10 Sep 2026, 18:45',
    status: 'Processed',
    sourceCode: 'CDR',
  },
  {
    id: 'db-3',
    name: 'Bank_Ledger_SBI_Axis_PassThrough_Tranches.xlsx',
    category: 'Financial Transactions',
    fileSize: '1.8 MB',
    recordsCount: 318,
    uploadedAt: '11 Sep 2026, 14:15',
    status: 'Processing',
    sourceCode: 'FIN',
  },
  {
    id: 'db-4',
    name: 'FASTag_Toll_ANPR_Checkpost_Bhandara.json',
    category: 'Location & Telemetry',
    fileSize: '850 KB',
    recordsCount: 27,
    uploadedAt: '09 Sep 2026, 11:20',
    status: 'Processed',
    sourceCode: 'LOC',
  },
];

interface DatabaseUploadSectionProps {
  resolutionQueue?: ResolutionPair[];
  onResolvePair?: (id: string) => void;
}

export const DatabaseUploadSection: React.FC<DatabaseUploadSectionProps> = ({
  resolutionQueue: propResolutionQueue,
  onResolvePair: propOnResolvePair,
}) => {
  const [databaseFiles, setDatabaseFiles] = useState<DatabaseRecordFile[]>(INITIAL_FILES);
  const [internalQueue, setInternalQueue] = useState<ResolutionPair[]>(DEFAULT_RESOLUTION_QUEUE);
  const currentQueue = propResolutionQueue || internalQueue;

  const handleResolve = (id: string) => {
    if (propOnResolvePair) {
      propOnResolvePair(id);
    } else {
      setInternalQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
      );
    }
  };

  const pendingResolutionCount = currentQueue.filter((q) => !q.resolved).length;
  const [activeLedgerTab, setActiveLedgerTab] = useState<'records' | 'resolution'>('records');

  const [selectedCategory, setSelectedCategory] = useState<DatabaseRecordFile['category']>('FIR / Case Records');
  const [targetCase, setTargetCase] = useState<string>('Case 24/2026 · Nagpur');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Ingestion parsing pipeline checkboxes
  const [autoNER, setAutoNER] = useState<boolean>(true);
  const [crossCorrelate, setCrossCorrelate] = useState<boolean>(true);
  const [flagAnomalies, setFlagAnomalies] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setStagedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStagedFile(e.target.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!stagedFile || isUploading) return;
    const fileToUpload = stagedFile;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(30);
    setUploadMessage('Uploading and running the extraction pipeline...');

    try {
      const result = await api.uploadCaseFile(fileToUpload);

      setUploadProgress(100);
      setUploadMessage(`Ingestion complete. ${result.data_count} records parsed.`);

      const sourceMap: Record<string, DatabaseRecordFile['sourceCode']> = {
        'FIR / Case Records': 'FIR',
        'Call Detail Records (CDR)': 'CDR',
        'Financial Transactions': 'FIN',
        'Location & Telemetry': 'LOC',
      };

      const newRecord: DatabaseRecordFile = {
        id: 'db-' + Date.now(),
        name: fileToUpload.name,
        category: selectedCategory,
        fileSize: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB`,
        recordsCount: result.data_count,
        uploadedAt: 'Just now',
        status: 'Processed',
        sourceCode: sourceMap[selectedCategory] || 'FIR',
      };

      setDatabaseFiles((prev) => [newRecord, ...prev]);
      setStagedFile(null);
      setSuccessToast(`Successfully ingested "${newRecord.name}" into ${targetCase}`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      setUploadProgress(0);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setDatabaseFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Header Notification Toast */}
      {successToast && (
        <div className="p-3.5 bg-[#e1ecdf] border border-[#bedec0] text-[#2d5c3f] rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3d6b53] shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-[#2d5c3f] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Upload Box & Options Panel */}
      <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#e8e2d4] bg-[#faf8f4] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#a94e2c]" />
              <h3 className="font-serif text-base font-bold text-slate-900 tracking-tight">
                Database Upload &amp; Evidence Ingestion
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload raw case files to extract entities, correlate phone linkages, and populate the relationship graph
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Target Docket:</span>
            <select
              value={targetCase}
              onChange={(e) => setTargetCase(e.target.value)}
              className="bg-white border border-[#ddd6c6] text-slate-800 text-xs rounded-md px-2.5 py-1 font-semibold focus:outline-none focus:border-[#a94e2c]"
            >
              <option value="Case 24/2026 · Nagpur">Case 24/2026 · Nagpur (Active)</option>
              <option value="Case 19/2026 · Raipur">Case 19/2026 · Raipur</option>
              <option value="Case 31/2025 · Bhandara">Case 31/2025 · Bhandara</option>
            </select>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 1. Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Evidence Source Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  {
                    cat: 'FIR / Case Records',
                    desc: 'Police charge sheets, legal FIRs & CCTNS extracts (PDF/DOCX)',
                    code: 'FIR',
                  },
                  {
                    cat: 'Call Detail Records (CDR)',
                    desc: 'Telecom bilateral logs, tower cell IDs & IMEI/IMSI (CSV/XLSX)',
                    code: 'CDR',
                  },
                  {
                    cat: 'Financial Transactions',
                    desc: 'Bank statements, NEFT/RTGS ledger exports (CSV/XLSX)',
                    code: 'FIN',
                  },
                  {
                    cat: 'Location & Telemetry',
                    desc: 'FASTag toll hits, ANPR camera OCR & GPS tracks (JSON/CSV)',
                    code: 'LOC',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.cat}
                  type="button"
                  onClick={() => setSelectedCategory(item.cat)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedCategory === item.cat
                      ? 'bg-[#fcf8f5] border-[#a94e2c] shadow-2xs'
                      : 'bg-white border-[#e8e2d4] hover:border-slate-300 hover:bg-[#faf9f6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        selectedCategory === item.cat
                          ? 'bg-[#a94e2c] text-white'
                          : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      {item.code}
                    </span>
                    {selectedCategory === item.cat && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#a94e2c]" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{item.cat}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#a94e2c] bg-[#fdf6f2]'
                : stagedFile
                ? 'border-[#3d6b53] bg-[#f5fbf7]'
                : 'border-[#ddd6c6] bg-[#fbfaf8] hover:border-slate-400 hover:bg-[#f8f6f2]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".csv,.pdf,.xlsx,.xls,.json,.txt"
              className="hidden"
            />

            <div className="max-w-md mx-auto flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  stagedFile
                    ? 'bg-[#e1ecdf] text-[#3d6b53]'
                    : 'bg-[#f3ded2] text-[#a94e2c]'
                }`}
              >
                <UploadCloud className="w-6 h-6" />
              </div>

              {stagedFile ? (
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Ready to Ingest: <span className="text-[#3d6b53]">{stagedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    File size: {(stagedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change file
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to browse or drop your database file here
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Supports CDR spreadsheets (.csv, .xlsx), Bank extracts (.csv, .xlsx), Police FIRs (.pdf), or Telemetry (.json)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                    Max file size: 50MB per batch • Encrypted CCTNS / ICJS standard
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Ingestion Pipeline Settings & Execution Button */}
          <div className="bg-[#faf8f4] border border-[#e8e2d4] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-slate-700">Ingestion Options:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={autoNER}
                  onChange={(e) => setAutoNER(e.target.checked)}
                  className="rounded border-[#ddd6c6] text-[#a94e2c] focus:ring-0"
                />
                <span>Auto-Extract Entities (NER)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={crossCorrelate}
                  onChange={(e) => setCrossCorrelate(e.target.checked)}
                  className="rounded border-[#ddd6c6] text-[#a94e2c] focus:ring-0"
                />
                <span>Cross-Correlate Phone &amp; Bank Links</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={flagAnomalies}
                  onChange={(e) => setFlagAnomalies(e.target.checked)}
                  className="rounded border-[#ddd6c6] text-[#a94e2c] focus:ring-0"
                />
                <span>Flag High-Confidence Anomalies</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              {stagedFile && (
                <button
                  type="button"
                  onClick={() => setStagedFile(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isUploading || !stagedFile}
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-2 cursor-pointer transition-colors ${
                  isUploading || !stagedFile
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#a94e2c] hover:bg-[#8a3e21] text-white'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Ingest into Case Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar (visible while uploading) */}
          {uploadError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-start justify-between gap-3">
              <span>{uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="hover:underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
          
        </div>
      </div>

      {/* Combined Ingestion Ledger & Entity Resolution Panel (Sub-Tabs + Bounded Internal Scroll) */}
      <div className="bg-[#fffefb] border border-[#ddd6c6] rounded-xl overflow-hidden shadow-2xs">
        {/* Sub-Tabs Header */}
        <div className="px-5 py-3.5 border-b border-[#e8e2d4] bg-[#faf8f4] flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Pill Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#ede8dc] rounded-lg border border-[#ddd6c6]/70">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('records')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeLedgerTab === 'records'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              <span>Connected Case Records</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activeLedgerTab === 'records'
                    ? 'bg-[#182029] text-white'
                    : 'bg-[#ddd6c6] text-slate-700'
                }`}
              >
                {databaseFiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLedgerTab('resolution')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeLedgerTab === 'resolution'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5 text-[#a94e2c]" />
              <span>Entity Resolution Queue</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  pendingResolutionCount > 0
                    ? 'bg-[#f3ded2] text-[#8a3e21]'
                    : 'bg-[#e1ecdf] text-[#2d5c3f]'
                }`}
              >
                {pendingResolutionCount}
              </span>
            </button>
          </div>

          {/* Context subtitle */}
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            {activeLedgerTab === 'records' ? (
              <span>Active Case 24/2026 Docket · {databaseFiles.length} Ingested Datasets</span>
            ) : (
              <span>{pendingResolutionCount} candidate pairs awaiting verification before consolidation</span>
            )}
          </div>
        </div>

        {/* Tab 1: Connected Case Database Records */}
        {activeLedgerTab === 'records' && (
          <div className="max-h-72 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#f8f6f0] border-b border-[#e8e2d4] text-slate-500 font-bold text-[11px] uppercase tracking-wider z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4">Source Type</th>
                  <th className="py-2.5 px-4">File Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Records Extracted</th>
                  <th className="py-2.5 px-4">Uploaded Time</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece6d8] text-slate-700">
                {databaseFiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No files ingested yet. Use the upload dropzone above.
                    </td>
                  </tr>
                ) : (
                  databaseFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#faf7f2] transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#182029] text-white tracking-wide">
                          {file.sourceCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[240px]">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{file.category}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                        {file.recordsCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{file.uploadedAt}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            file.status === 'Processed'
                              ? 'bg-[#e1ecdf] text-[#2d5c3f]'
                              : file.status === 'Processing'
                              ? 'bg-[#f3ded2] text-[#8a3e21]'
                              : 'bg-[#f2e6c9] text-[#7d5612]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              file.status === 'Processed'
                                ? 'bg-[#3d6b53]'
                                : file.status === 'Processing'
                                ? 'bg-[#a94e2c] animate-pulse'
                                : 'bg-[#a5751f]'
                            }`}
                          />
                          {file.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          title="Delete record from case"
                          onClick={() => handleDeleteRecord(file.id)}
                          className="p-1 text-slate-400 hover:text-rose-700 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Entity Resolution Queue */}
        {activeLedgerTab === 'resolution' && (
          <div className="max-h-72 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#f8f6f0] border-b border-[#e8e2d4] text-slate-500 font-bold text-[11px] uppercase tracking-wider z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4">Record A (Source)</th>
                  <th className="py-2.5 px-4">Record B (Target Candidate)</th>
                  <th className="py-2.5 px-4">Match Confidence</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece6d8] text-slate-700">
                {currentQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-[#faf7f2] transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      {item.a}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      {item.b}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.conf >= 0.85 ? 'bg-[#3d6b53]' : 'bg-[#a5751f]'
                            }`}
                            style={{ width: `${item.conf * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-800">
                          {item.conf.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {item.resolved ? (
                        <span className="text-xs text-[#2d5c3f] font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3d6b53]" />
                          Consolidated
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                            item.action === 'merge'
                              ? 'bg-[#e1ecdf] hover:bg-[#cbe2c8] text-[#2d5c3f]'
                              : 'bg-[#f2e6c9] hover:bg-[#e7d4a4] text-[#7d5612]'
                          }`}
                        >
                          {item.action === 'merge' ? 'Merge Entity' : 'Review Match'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
