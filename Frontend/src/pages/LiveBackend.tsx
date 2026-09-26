import { useState } from "react";
import {
  uploadCaseFile,
  analyzeGraph,
  getGraph,
  sendChatMessage,
} from "../services/backendApi";

type ChatLine = { role: "you" | "agent"; text: string };

function extractReply(data: any): string {
  if (typeof data === "string") return data;
  return data?.response ?? data?.message ?? data?.reply ?? JSON.stringify(data, null, 2);
}

export default function LiveBackend() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [graph, setGraph] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatLine[]>([]);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await action();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setBusy("");
    }
  }

  const handleUpload = () =>
    run("Uploading and processing...", async () => {
      if (!file) throw new Error("Choose a .zip or data file first");
      setUploadResult(await uploadCaseFile(file));
    });

  const handleAnalyze = () =>
    run("Analyzing graph...", async () => {
      setAnalysis(await analyzeGraph());
    });

  const handleLoadGraph = () =>
    run("Loading graph...", async () => {
      setGraph(await getGraph());
    });

  const handleChat = () =>
    run("Waiting for agent...", async () => {
      const message = chatInput.trim();
      if (!message) return;
      setChatLog((log) => [...log, { role: "you", text: message }]);
      setChatInput("");
      const data = await sendChatMessage(message);
      setChatLog((log) => [...log, { role: "agent", text: extractReply(data) }]);
    });

  const buttonStyle =
    "rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Anveshak: Live Backend Test</h1>

      {busy && <p className="text-blue-600">{busy}</p>}
      {error && <p className="rounded bg-red-100 p-3 text-red-700">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Upload case data</h2>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className={buttonStyle} disabled={!!busy} onClick={handleUpload}>
          Upload and process
        </button>
        {uploadResult && (
          <p>
            {uploadResult.message} ({uploadResult.data_count} items extracted)
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Analyze network and alerts</h2>
        <button className={buttonStyle} disabled={!!busy} onClick={handleAnalyze}>
          Run analysis
        </button>
        {analysis && (
          <div className="space-y-2">
            <p>
              {analysis.nodes_count} nodes, {analysis.edges_count} edges,{" "}
              {analysis.alerts_count} alerts
            </p>
            {analysis.alerts?.map((alert: any) => (
              <div key={alert.alert_id} className="space-y-1 rounded border p-3">
                <div className="flex items-center justify-between">
                  <strong>{alert.entity_name}</strong>
                  <span className="text-sm text-slate-600">
                    {alert.rule_triggered} · {Math.round(alert.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm">{alert.reason_text}</p>
                <ul className="text-xs text-slate-500">
                  {alert.evidence?.map((item: any, index: number) => (
                    <li key={index}>
                      [{item.source_type}] {item.source_id}: {item.snippet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Network graph data</h2>
        <button className={buttonStyle} disabled={!!busy} onClick={handleLoadGraph}>
          Load graph
        </button>
        {graph && (
          <div>
            <p>
              {graph.nodes.length} nodes, {graph.edges.length} edges
            </p>
            <pre className="max-h-64 overflow-auto rounded bg-slate-100 p-2 text-xs">
              {JSON.stringify(
                { nodes: graph.nodes.slice(0, 10), edges: graph.edges.slice(0, 10) },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Chat with the agent</h2>
        <div className="space-y-2">
          {chatLog.map((line, index) => (
            <p key={index} className={line.role === "you" ? "font-medium" : ""}>
              <strong>{line.role === "you" ? "You" : "Agent"}:</strong> {line.text}
            </p>
          ))}
        </div>
        <input
          className="w-full rounded border p-2"
          value={chatInput}
          placeholder="Ask something..."
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChat()}
        />
        <button className={buttonStyle} disabled={!!busy} onClick={handleChat}>
          Send
        </button>
      </section>
    </div>
  );
}