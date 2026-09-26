import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Investigation, Entity, AlertItem } from '../types';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  verified?: boolean;
  confidence?: number;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseParam = searchParams.get('case');

  const [cases, setCases] = useState<Investigation[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseParam || '');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  useEffect(() => {
    api.getInvestigations().then((list) => {
      setCases(list);
      if (!caseParam && list.length > 0) setSelectedCaseId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (caseParam) setSelectedCaseId(caseParam);
  }, [caseParam]);

  useEffect(() => {
    if (!selectedCaseId) return;
    Promise.all([api.getEntities(selectedCaseId), api.getAlerts(selectedCaseId)]).then(
      ([e, a]) => {
        setEntities(e);
        setAlerts(a);
      }
    );
  }, [selectedCaseId]);

  // Welcome message whenever the active case changes
  useEffect(() => {
    if (!activeCase) return;
    const primary = entities[0];
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text:
          `Welcome, Officer. I'm your ANVESHAK AI copilot.\n\n` +
          `Active Investigation: ${activeCase.title} (${activeCase.firNumber})\n` +
          `• Jurisdiction: ${activeCase.location} — ${activeCase.department}\n` +
          `• Lead Officer: ${activeCase.leadInvestigator}\n` +
          `${primary ? `• Primary Entity: ${primary.name}${primary.role ? ` (${primary.role})` : ''}\n` : ''}` +
          `\nAsk me anything in plain English, or try a suggested prompt below.`,
        timestamp: 'Just now',
      },
    ]);
  }, [activeCase?.id, entities.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleCaseChange = (id: string) => {
    setSelectedCaseId(id);
    const params = new URLSearchParams(searchParams);
    params.set('case', id);
    navigate(`/ai-assistant?${params.toString()}`);
  };

  const buildAnswer = (question: string): { text: string; confidence: number } => {
    const q = question.toLowerCase();
    const primary = entities[0];
    const highRisk = entities.filter((e) => e.riskLevel === 'high');

    if (q.includes('suspect') || q.includes('primary') || q.includes('kingpin')) {
      return {
        text: primary
          ? `The primary entity of interest is ${primary.name}${
              primary.role ? `, identified as "${primary.role}"` : ''
            }. ${primary.notes || 'Flagged based on centrality within the relationship graph and corroborated multi-source evidence.'} ${
              primary.identifier ? `Reference: ${primary.identifier}.` : ''
            }`
          : `No primary suspect has been resolved yet for this case. Try running entity resolution from the Upload Data tab.`,
        confidence: 96,
      };
    }

    if (q.includes('bank') || q.includes('transfer') || q.includes('financial') || q.includes('money')) {
      const financial = alerts.filter((a) =>
        `${a.title} ${a.message}`.toLowerCase().includes('transfer') ||
        `${a.title} ${a.message}`.toLowerCase().includes('account') ||
        `${a.title} ${a.message}`.toLowerCase().includes('fund')
      );
      return {
        text: financial.length
          ? `I found ${financial.length} high-risk financial signal(s):\n\n` +
            financial.map((a) => `• ${a.title} — ${a.message}`).join('\n')
          : `No high-risk financial transfers are currently flagged for this case. All tracked accounts appear within normal thresholds.`,
        confidence: 93,
      };
    }

    if (q.includes('evidence') || q.includes('exhibit') || q.includes('forensic') || q.includes('document')) {
      return {
        text:
          `This case has ${entities.length} resolved entities and ${alerts.length} active alert(s) logged. ` +
          `Evidence exhibits (FIR filings, CDR logs, banking ledgers) are catalogued under the Reports tab, each hash-chained under Section 65B compliance. ` +
          `Would you like me to open the Reports dossier for this case?`,
        confidence: 91,
      };
    }

    if (q.includes('risk') || q.includes('flag') || q.includes('alert')) {
      return {
        text: highRisk.length
          ? `${highRisk.length} entit${highRisk.length === 1 ? 'y is' : 'ies are'} currently flagged high-risk: ` +
            highRisk.map((e) => e.name).join(', ') +
            `. ${alerts.length} alert(s) are active for this case overall.`
          : `No entities are currently flagged high-risk in this case.`,
        confidence: 95,
      };
    }

    return {
      text:
        `I can help with questions about suspects, financial transfers, evidence exhibits, or risk flags for ${
          activeCase?.title || 'the active case'
        }. Try one of the suggested prompts below, or rephrase your question.`,
      confidence: 82,
    };
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: 'Just now',
    };
    const { text: answerText, confidence } = buildAnswer(text);
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: answerText,
      verified: true,
      confidence,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const suggestedPrompts = [
    `Who is the primary suspect in ${activeCase?.title || 'this case'}?`,
    `Show high-risk bank transfers for ${activeCase?.title || 'this case'}`,
    `Inspect forensic evidence exhibits for ${activeCase?.title || 'this case'}`,
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Assistant
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Natural language intelligence assistant for Indian law enforcement officers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Mock Mode · Case-Scoped
          </span>
          <button
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Case selector */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs w-fit">
        <span className="text-xs text-slate-400 font-medium">Case:</span>
        <select
          value={selectedCaseId}
          onChange={(e) => handleCaseChange(e.target.value)}
          className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
        >
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.caseNumber} — {c.title.slice(0, 26)}
            </option>
          ))}
        </select>
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[560px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? '' : 'flex gap-2.5'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                )}
                <div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.role === 'assistant' && m.verified && (
                    <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified with case data
                      </span>
                      <span>AI Confidence: {m.confidence}%</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-300 mt-0.5 px-1">{m.timestamp}</div>
                </div>
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="flex flex-col gap-2 pl-9 pt-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask me anything in plain English..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={() => sendMessage(input)}
            className="w-9 h-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
