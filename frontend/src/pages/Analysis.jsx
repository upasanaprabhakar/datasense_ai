import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { NeuralBackground } from "../components/NeuralBackground";
import { Network, Brain, ShieldCheck, ChevronRight, Zap, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useProjectStore } from "../stores/projectStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AGENT_CONFIG = {
  atlas: {
    icon: Network,
    label: "Schema Agent",
    activeColors: { border: "border-ds-primary/70", glow: "shadow-[0_0_20px_rgba(99,102,241,0.2)]", iconBg: "bg-ds-primary/20", iconBorder: "border-ds-primary", iconText: "text-ds-primary", status: "text-ds-primary", bar: "from-ds-primary to-ds-secondary" },
    completeColors: { border: "border-ds-success/70", glow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]", iconBg: "bg-ds-success/20", iconBorder: "border-ds-success", iconText: "text-ds-success", status: "text-ds-success", bar: "from-ds-success to-emerald-400" },
  },
  sage: {
    icon: Brain,
    label: "Business Agent",
    activeColors: { border: "border-ds-secondary/70", glow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]", iconBg: "bg-ds-secondary/20", iconBorder: "border-ds-secondary", iconText: "text-ds-secondary", status: "text-ds-secondary", bar: "from-ds-primary to-ds-secondary" },
    completeColors: { border: "border-ds-success/70", glow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]", iconBg: "bg-ds-success/20", iconBorder: "border-ds-success", iconText: "text-ds-success", status: "text-ds-success", bar: "from-ds-success to-emerald-400" },
  },
  guardian: {
    icon: ShieldCheck,
    label: "Quality Agent",
    activeColors: { border: "border-blue-400/70", glow: "shadow-[0_0_20px_rgba(96,165,250,0.2)]", iconBg: "bg-blue-400/20", iconBorder: "border-blue-400", iconText: "text-blue-400", status: "text-blue-400", bar: "from-blue-400 to-cyan-400" },
    completeColors: { border: "border-ds-success/70", glow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]", iconBg: "bg-ds-success/20", iconBorder: "border-ds-success", iconText: "text-ds-success", status: "text-ds-success", bar: "from-ds-success to-emerald-400" },
  },
};

function NoProjectState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center mb-6">
        <Zap className="w-10 h-10 text-ds-primary/50" />
      </div>
      <h2 className="text-2xl font-bold text-ds-text-primary mb-3">No Active Analysis</h2>
      <p className="text-ds-text-muted mb-8 max-w-sm">
        Upload a CSV or Excel file first to start the AI agent pipeline analysis.
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

function AgentCard({ agentKey, agentData }) {
  const config = AGENT_CONFIG[agentKey];
  const Icon = config.icon;
  const isWaiting  = agentData.status === "waiting";
  const isActive   = agentData.status === "active";
  const isComplete = agentData.status === "complete";
  const colors  = isComplete ? config.completeColors : config.activeColors;
  const progress = agentData.progress || 0;

  return (
    <div className={`flex-1 relative bg-ds-surface backdrop-blur-xl border rounded-2xl p-5 transition-all duration-500 ${isWaiting ? "border-ds-border opacity-60" : `${colors.border} ${colors.glow}`}`}>
      <div className="flex flex-col items-center mb-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 border-2 transition-all duration-500 ${isWaiting ? "bg-ds-surface-solid border-ds-border" : `${colors.iconBg} ${colors.iconBorder} ${isActive ? "animate-pulse" : ""}`}`}>
          <Icon className={`w-7 h-7 ${isWaiting ? "text-ds-text-muted" : colors.iconText}`} />
        </div>
        <h3 className="text-base font-bold text-ds-text-primary capitalize">{agentKey}</h3>
        <p className="text-xs text-ds-text-muted">{config.label}</p>
      </div>

      <div className={`text-xs font-semibold text-center mb-3 ${isWaiting ? "text-ds-text-muted" : colors.status}`}>
        {isComplete && "Complete ✓"}
        {isActive && (
          <span className="flex items-center justify-center gap-1">
            Processing
            <span className="flex gap-0.5">
              {[0,1,2].map((i) => (
                <span key={i} className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </span>
          </span>
        )}
        {isWaiting && "Waiting..."}
      </div>

      <div className="h-1 bg-ds-border rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${isWaiting ? "bg-ds-border w-0" : colors.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-1 min-h-12">
        {(agentData.logs || []).slice(-4).map((log, i) => (
          <div key={i} className={`text-xs font-mono flex items-start gap-1 ${isWaiting ? "text-ds-text-muted/40" : "text-ds-text-muted"}`}>
            <ChevronRight className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isWaiting ? "text-ds-text-muted/30" : "text-ds-primary"}`} />
            <span className="leading-tight truncate">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Analysis() {
  const navigate = useNavigate();
  const { projectId, updateAnalysis } = useProjectStore();
  const [agentStatus, setAgentStatus] = useState({
    atlas:    { status: "waiting", progress: 0, logs: [] },
    sage:     { status: "waiting", progress: 0, logs: [] },
    guardian: { status: "waiting", progress: 0, logs: [] },
  });
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [dots, setDots] = useState(".");
  const [pipelineStatus, setPipelineStatus] = useState("analyzing");
  const terminalRef = useRef(null);
  const pollRef = useRef(null);
  const seenLogs = useRef(new Set());

  useEffect(() => {
    const t = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLogs]);

  useEffect(() => {
    if (!projectId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analysis/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        setAgentStatus(data.agentStatus);
        updateAnalysis(data);
        setPipelineStatus(data.status);

        ["atlas", "sage", "guardian"].forEach((agent) => {
          const colorMap = { atlas: "text-indigo-400", sage: "text-purple-400", guardian: "text-blue-400" };
          (data.agentStatus[agent]?.logs || []).forEach((log) => {
            const key = `${agent}-${log.time}-${log.msg}`;
            if (!seenLogs.current.has(key)) {
              seenLogs.current.add(key);
              setTerminalLogs((prev) => [...prev, { agent: agent.toUpperCase(), time: log.time, msg: log.msg, color: colorMap[agent] }]);
            }
          });
        });

        if (data.status === "complete") {
          clearInterval(pollRef.current);
          setTimeout(() => navigate("/dictionary"), 5000);
        }
        if (data.status === "error") clearInterval(pollRef.current);
      } catch (err) {
        console.error("Poll error:", err.message);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [projectId, navigate, updateAnalysis]);

  return (
    <div className="min-h-screen relative bg-ds-background">
      <NeuralBackground />
      <Sidebar />
      <div className="ml-72 relative z-10">
        <Navbar />
        <main className="p-8">
          {!projectId ? <NoProjectState /> : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-ds-text-primary mb-3">
                  {pipelineStatus === "complete" ? "Analysis Complete ✓" : `Analyzing your dataset${dots}`}
                </h1>
                <p className="text-ds-text-muted">Our AI agents are working together to understand your data</p>
                <p className="text-xs text-ds-text-muted/50 mt-1 tracking-widest uppercase font-medium">Multi-Agent Pipeline</p>
              </div>

              <div className="max-w-5xl mx-auto mb-6">
                <div className="grid grid-cols-3 gap-4 relative">
                  {/* Connector line 1 — between atlas and sage */}
                  <div className="absolute top-16 left-[calc(33.33%-20px)] w-[calc(33.33%+40px)] h-px z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-ds-border" />
                    {agentStatus.atlas.progress > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-ds-primary to-ds-secondary transition-all duration-500"
                        style={{ width: `${Math.min(agentStatus.atlas.progress, 100)}%` }} />
                    )}
                  </div>
                  {/* Connector line 2 — between sage and guardian */}
                  <div className="absolute top-16 left-[calc(66.66%-20px)] w-[calc(33.33%-20px)] h-px z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-ds-border" />
                    {agentStatus.sage.progress > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-ds-secondary to-blue-400 transition-all duration-500"
                        style={{ width: `${Math.min(agentStatus.sage.progress, 100)}%` }} />
                    )}
                  </div>
                  <AgentCard agentKey="atlas" agentData={agentStatus.atlas} />
                  <AgentCard agentKey="sage" agentData={agentStatus.sage} />
                  <AgentCard agentKey="guardian" agentData={agentStatus.guardian} />
                </div>
              </div>

              <div className="max-w-5xl mx-auto">
                <div className="bg-[#080812] border border-ds-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ds-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <span className="ml-2 text-xs font-mono text-ds-text-muted">Real-time Agent Activity</span>
                  </div>
                  <div ref={terminalRef} className="p-4 h-44 overflow-y-auto space-y-1 font-mono text-xs scroll-smooth">
                    {terminalLogs.length === 0 && <span className="text-ds-text-muted">Initializing agents{dots}</span>}
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-ds-text-muted/50 flex-shrink-0">[{log.time}]</span>
                        <span className={`font-bold flex-shrink-0 w-16 ${log.color}`}>{log.agent}</span>
                        <span className="text-ds-text-muted/60">→</span>
                        <span className="text-ds-text-primary/70">{log.msg}</span>
                        {i === terminalLogs.length - 1 && pipelineStatus !== "complete" && <span className={`${log.color} animate-pulse`}>▋</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}