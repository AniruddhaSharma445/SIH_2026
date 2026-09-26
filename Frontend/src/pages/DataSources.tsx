import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  FileText,
  PhoneCall,
  Landmark,
  Car,
  AlertTriangle,
  Layers,
  Radio,
  Clock,
  Shield,
  UploadCloud,
} from 'lucide-react';
import { api } from '../services/api';
import { DataSourceItem } from '../types';

export const DataSources: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getDataSources().then(setSources);
  }, []);

  const handleSyncSource = async (source: DataSourceItem) => {
    try {
      setSyncingId(source.id);
      const res = await api.syncDataSource(source.id);
      setSyncNotice(`Synchronized records for "${source.name}". Pipeline processed ${res.recordsProcessed} new entries.`);
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (err) {
      console.error('Failed to sync data source', err);
      setSyncNotice(`Failed to sync "${source.name}".`);
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setSyncingId(null);
    }
  };

  const getSourceIcon = (name: string) => {
    if (name.includes('FIR')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (name.includes('Call')) return <PhoneCall className="w-5 h-5 text-emerald-600" />;
    if (name.includes('Financial')) return <Landmark className="w-5 h-5 text-purple-600" />;
    if (name.includes('Transport') || name.includes('Toll')) return <Car className="w-5 h-5 text-amber-600" />;
    return <Database className="w-5 h-5 text-cyan-600" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <span>Multi-Source Ingestion Architecture</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Intelligence Data Sources
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Standardized ingestion channels feeding the ANVESHAK entity resolution pipeline
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>All 6 Simulated Feeds Active</span>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid of Data Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header Icon & Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {getSourceIcon(source.name)}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {source.status}
                </span>
              </div>

              {/* Source Title & Category */}
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {source.name}
              </h3>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">
                {source.category}
              </p>

              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                {source.description}
              </p>

              {/* Ingestion Specs */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Records:</span>
                  <strong className="text-slate-900 font-bold">
                    {source.recordCount.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ingestion Format:</span>
                  <span className="font-mono text-slate-700">{source.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution Confidence:</span>
                  <span className="font-semibold text-emerald-600">
                    {source.confidenceScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provider Feed:</span>
                  <span className="text-slate-600 truncate max-w-[140px]" title={source.provider}>
                    {source.provider}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Sync action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {source.lastUpdated}
              </span>

              <button
                type="button"
                onClick={() => handleSyncSource(source)}
                disabled={syncingId === source.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    syncingId === source.id ? 'animate-spin' : ''
                  }`}
                />
                <span>{syncingId === source.id ? 'Syncing...' : 'Sync Stream'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Disclaimer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 leading-relaxed space-y-2">
        <p className="font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          Ingestion Architecture &amp; Data Ethics Note
        </p>
        <p>
          ANVESHAK operates in strict sandboxed mode with synthetic datasets for analytical demonstration.
          No live telecommunications intercept or real banking switch connections are executed.
          In a production deployment, all connectors plug into authorized statutory gateways with cryptographic audit logs.
        </p>
      </div>
    </div>
  );
};
