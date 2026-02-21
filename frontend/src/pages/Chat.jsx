import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { NeuralBackground } from "../components/NeuralBackground";
import { Send, Zap, User, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "../stores/projectStore";
import { useNavigate, useSearchParams } from "react-router-dom";


function getQualityColor(q) {
  if (q >= 90) return "text-ds-success";
  if (q >= 75) return "text-ds-warning";
  return "text-ds-error";
}
function getQualityBg(q) {
  if (q >= 90) return "bg-ds-success";
  if (q >= 75) return "bg-ds-warning";
  return "bg-ds-error";
}

const SUGGESTED = [
  "Which fields have quality issues?",
  "Show me all fields and their types",
  "Generate SQL to find active users",
  "What are the primary key fields?",
];

function NoProjectState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center mb-6">
        <Zap className="w-10 h-10 text-ds-primary/50" />
      </div>
      <h2 className="text-2xl font-bold text-ds-text-primary mb-3">No Data Loaded</h2>
      <p className="text-ds-text-muted mb-8 max-w-sm">
        Upload a dataset first so the AI assistant has context about your data dictionary.
      </p>
      <button
        onClick={() => navigate("/upload")}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ds-primary to-ds-secondary text-white rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all font-medium"
      >
        <Upload className="w-5 h-5" />
        Upload a File
      </button>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? "bg-ds-surface border border-ds-border" : "bg-gradient-to-br from-ds-primary to-ds-secondary"}`}>
        {isUser ? <User className="w-4 h-4 text-ds-text-primary" /> : <Zap className="w-4 h-4 text-white" />}
      </div>
      <div className={`flex-1 max-w-2xl ${isUser ? "flex justify-end" : ""}`}>
        <div className={`relative p-4 rounded-xl text-sm ${isUser ? "bg-ds-primary/10 border border-ds-primary/30 text-ds-text-primary" : "bg-ds-surface border border-ds-border text-ds-text-primary"}`}>
          {message.sqlCode ? (
            <div className="space-y-3">
              {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
              <div className="bg-[#080812] border border-ds-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-ds-border">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-ds-text-muted font-mono ml-1">SQL</span>
                </div>
                <pre className="p-4 text-xs font-mono text-ds-text-primary overflow-x-auto leading-relaxed"><code>{message.sqlCode}</code></pre>
              </div>
              {message.suffix && <p className="whitespace-pre-wrap text-ds-text-muted text-xs">{message.suffix}</p>}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
const urlProjectId = searchParams.get("projectId");
const { projectId: storeProjectId, dictionary, fileName, setDictionary } = useProjectStore();
const projectId = urlProjectId || storeProjectId;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const getWelcomeMessage = () => ({
    id: 1,
    role: "assistant",
    content: projectId && dictionary?.length > 0
      ? `Hello! I have full context of your "${fileName}" data dictionary with ${dictionary.length} fields analyzed. Ask me anything about your data, or I can generate SQL queries for you.`
      : "Hello! I'm your AI data assistant. Upload a dataset first to unlock full data dictionary context.",
  });

  const [messages, setMessages] = useState([getWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, [projectId, dictionary?.length]);

  const relatedFields = [...(dictionary || [])]
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, 4);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
  if (!projectId) return;

  async function loadDictionary() {
    try {
      const res = await fetch(`${API_URL}/api/dictionary/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.fields?.length > 0) {
          setDictionary(data.fields);
          return;
        }
      }
      const supaRes = await fetch(`${API_URL}/api/projects/${projectId}`);
      if (!supaRes.ok) return;
      const supaData = await supaRes.json();
      const normalized = (supaData.fields || []).map((f) => ({
        fieldName:        f.field_name,
        detectedType:     f.detected_type,
        description:      f.description,
        businessCategory: f.business_category,
        qualityScore:     f.quality_score,
        confidence:       f.confidence,
        status:           f.status ?? "pending",
        isPrimaryKey:     f.is_primary_key ?? false,
        isForeignKey:     f.is_foreign_key ?? false,
        nullRate:         f.null_rate,
        uniqueRate:       f.unique_rate,
        uniqueCount:      f.unique_count,
        patterns:         f.patterns,
        sampleValues:     f.sample_values,
        issues:           f.issues,
      }));
      setDictionary(normalized);
    } catch (err) {
      console.error("Chat: failed to load dictionary", err.message);
    }
  }

  loadDictionary();
}, [projectId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: messages.length + 1, role: "user", content: input };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: input, history }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: data.content,
        sqlCode: data.sqlCode,
        suffix: data.suffix,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: "Sorry, I couldn't process that request. Please try again.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-ds-background">
      <NeuralBackground />
      <Sidebar />

      <div className="ml-72 relative z-10">
        <Navbar />
        <main className="h-[calc(100vh-4rem)] flex overflow-hidden">

          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-4 border-b border-ds-border bg-ds-surface-solid/30 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ds-primary to-ds-secondary flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ds-text-primary">AI Data Assistant</h2>
                  <p className="text-xs text-ds-text-muted">
                    {dictionary?.length > 0 ? `${dictionary.length} fields loaded from ${fileName}` : "Upload a file to unlock full context"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${projectId ? "bg-ds-success" : "bg-ds-warning"}`} />
                  <span className={`text-xs font-medium ${projectId ? "text-ds-success" : "text-ds-warning"}`}>
                    {projectId ? "Context Loaded" : "No Context"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ds-primary to-ds-secondary flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-ds-surface border border-ds-border rounded-xl px-4 py-3">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 bg-ds-primary rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-ds-border bg-ds-surface-solid/30 backdrop-blur-xl flex-shrink-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => setInput(q)}
                    className="px-3 py-1.5 bg-ds-surface border border-ds-border rounded-full text-xs text-ds-text-muted hover:text-ds-text-primary hover:border-ds-primary/50 hover:bg-ds-primary/5 transition-all">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  placeholder="Ask anything about your data..."
                  className="flex-1 bg-ds-surface border border-ds-border rounded-xl px-5 py-3 text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all" />
                <button onClick={handleSend} disabled={!input.trim() || isTyping}
                  className="px-5 py-3 bg-gradient-to-r from-ds-primary to-ds-secondary text-white rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-ds-border bg-ds-surface-solid/30 backdrop-blur-xl overflow-y-auto flex-shrink-0">
            <div className="p-5">
              {!projectId ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Upload className="w-8 h-8 text-ds-text-muted/40 mb-3" />
                  <p className="text-xs text-ds-text-muted">No project loaded</p>
                  <button onClick={() => navigate("/upload")} className="mt-3 text-xs text-ds-primary hover:underline">Upload a file →</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-ds-primary rounded-full animate-pulse" />
                    <h3 className="text-xs font-bold text-ds-text-primary uppercase tracking-wider">Top Fields by Quality</h3>
                  </div>
                  <div className="space-y-2 mb-6">
                    {relatedFields.map((field) => (
                      <div key={field.fieldName} className="bg-ds-surface border border-ds-border rounded-lg p-3 hover:border-ds-primary/50 cursor-pointer transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-ds-primary truncate">{field.fieldName}</div>
                            <div className="text-xs text-ds-text-muted mt-0.5">{field.detectedType}</div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${getQualityBg(field.qualityScore)}`} />
                            <span className={`text-xs font-semibold ${getQualityColor(field.qualityScore)}`}>{field.qualityScore}%</span>
                          </div>
                        </div>
                        <div className="h-1 bg-ds-surface-solid rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getQualityBg(field.qualityScore)}`} style={{ width: `${field.qualityScore}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-ds-surface/50 border border-ds-border rounded-lg">
                    <h4 className="text-xs font-semibold text-ds-text-muted uppercase tracking-wider mb-3">Context Info</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between"><span className="text-ds-text-muted">Total Fields</span><span className="text-ds-text-primary font-semibold">{dictionary?.length || 0}</span></div>
                      <div className="flex justify-between"><span className="text-ds-text-muted">File</span><span className="text-ds-text-primary font-semibold truncate ml-2 max-w-28">{fileName || "—"}</span></div>
                      <div className="flex justify-between">
                        <span className="text-ds-text-muted">Avg Quality</span>
                        <span className="text-ds-success font-semibold">
                          {dictionary?.length > 0 ? Math.round(dictionary.reduce((s, f) => s + (f.qualityScore || 0), 0) / dictionary.length) + "%" : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}