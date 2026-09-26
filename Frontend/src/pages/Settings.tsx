import React, { useState } from 'react';
import {
  User,
  Bell,
  Sliders,
  Shield,
  Server,
  CheckCircle2,
  Save,
  Key,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [profileName, setProfileName] = useState('Inspector K. Raman');
  const [department, setDepartment] = useState('Cyber & Crime Special Operations');
  const [email, setEmail] = useState('k.raman@investigations.internal.gov');

  // Preferences
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyCdrSpike, setNotifyCdrSpike] = useState(true);
  const [notifyFinancialLoop, setNotifyFinancialLoop] = useState(true);

  // Analysis
  const [centralityThreshold, setCentralityThreshold] = useState('0.75');
  const [minConfidenceScore, setMinConfidenceScore] = useState('85');
  const [autoResolveEntities, setAutoResolveEntities] = useState(true);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          System &amp; Investigation Settings
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
          Configure investigator credentials, anomaly thresholds, and intelligence pipelines
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Preferences successfully updated and saved locally.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Investigator Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Investigator Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name &amp; Rank
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Unit / Branch
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Official Secure Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <Bell className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Alert &amp; Signal Preferences
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-100 transition-colors">
              <div>
                <p className="font-bold text-slate-800">
                  High-Risk Anomaly Immediate Push
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Trigger priority notifications when a node crosses 3 high-risk thresholds
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyHighRisk}
                onChange={(e) => setNotifyHighRisk(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-100 transition-colors">
              <div>
                <p className="font-bold text-slate-800">
                  CDR Burst &amp; Tower Handoff Alerts
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Notify when a burner phone shows &gt;300% sudden call frequency spike
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyCdrSpike}
                onChange={(e) => setNotifyCdrSpike(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-100 transition-colors">
              <div>
                <p className="font-bold text-slate-800">
                  Circular Financial Transfer Loops
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Detect multi-hop banking routes returning funds to origin shell company
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyFinancialLoop}
                onChange={(e) => setNotifyFinancialLoop(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* 3. Analysis Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Graph Analysis Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Betweenness Centrality Threshold
              </label>
              <select
                value={centralityThreshold}
                onChange={(e) => setCentralityThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="0.65">0.65 (Standard Sensitivity)</option>
                <option value="0.75">0.75 (Recommended Default)</option>
                <option value="0.85">0.85 (High Precision / Low Noise)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Min. Entity Resolution Match Confidence
              </label>
              <select
                value={minConfidenceScore}
                onChange={(e) => setMinConfidenceScore(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="75">75% Confidence</option>
                <option value="85">85% Recommended</option>
                <option value="95">95% Strict Cross-Verification</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Data Privacy & Ethical Guidelines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Data Privacy &amp; Ethical Guardrails
            </h3>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              • <strong>Decision Support Mandate:</strong> ANVESHAK assists investigators by organizing fragmented evidence into coherent network topologies. Automated indicators do not constitute legal proof or judicial guilt.
            </p>
            <p>
              • <strong>Section 65B Compliance:</strong> All telemetry and electronic records require cryptographic hash timestamp verification before introduction into official court chargesheets.
            </p>
            <p>
              • <strong>Synthetic Data Sandbox:</strong> All data stored in this environment is synthetic and fictional. No real personal records are processed.
            </p>
          </div>
        </div>

        {/* 5. System Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <Server className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              System Information
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block">Frontend Build</span>
              <strong className="text-slate-800 font-mono">v1.2.4</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block">Graph Engine</span>
              <strong className="text-slate-800 font-mono">Topological v2.1</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block">API Abstraction</span>
              <strong className="text-blue-600 font-mono">REST Ready</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-400 block">Data Mode</span>
              <strong className="text-emerald-600 font-mono">Sandbox Mock</strong>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings &amp; Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
