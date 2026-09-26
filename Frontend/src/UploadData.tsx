          {(activeView === 'upload' || activeView === 'system') && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-[#726c5d] font-medium tracking-wide mb-1">
                    Case {currentCase} / Ingestion
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Database Upload &amp; Evidence Ingestion
                  </h1>
                </div>
                <div className="text-xs text-[#726c5d] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3d6b53]" />
                  <span>4 sources connected • {pendingResolutionCount} entity pairs awaiting resolution</span>
                </div>
              </div>

              {/* Source Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">FIR / Case Records</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">62</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    Processed &amp; Extracted
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Call Detail Records (CDR)</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">941</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    Processed &amp; Triangulated
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#a94e2c] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Financial Transactions</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">318</div>
                  <div className="text-[11px] text-[#8a3e21] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a94e2c] animate-pulse" />
                    Processing Bank Tranches
                  </div>
                </div>

                <div className="bg-[#fffefb] border border-[#ddd6c6] border-t-3 border-t-[#3d6b53] rounded-xl p-4 shadow-2xs">
                  <div className="text-xs font-bold text-slate-700">Location &amp; Telemetry</div>
                  <div className="font-serif text-2xl font-bold text-slate-900 mt-1">27</div>
                  <div className="text-[11px] text-[#3d6b53] font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b53]" />
                    ANPR Hits Correlated
                  </div>
                </div>
              </div>

              {/* Combined Database Ingestion & Entity Resolution Workspace */}
              <DatabaseUploadSection
                resolutionQueue={resolutionQueue}
                onResolvePair={handleResolvePair}
              />
            </div>
          )}