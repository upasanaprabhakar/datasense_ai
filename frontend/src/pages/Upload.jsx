import { Upload as UploadIcon, Database, ChevronDown, Check, Loader2, AlertCircle, Layers } from "lucide-react";
import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlowButton } from "../components/GlowButton";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useProjectStore } from "../stores/projectStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function Upload() {
  const navigate = useNavigate();
  const { setProject, addProject } = useProjectStore();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDb, setSelectedDb] = useState("PostgreSQL");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [dbTables, setDbTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [connectionString, setConnectionString] = useState("default");

  const getConnectionString = () => {
    const url = supabaseUrl.trim();
    const key = supabaseKey.trim();
    if (!url && !key) return "default";
    if (url && key) return `${url}|${key}`;
    return url;
  };

  // ── CSV handlers ──────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) { setError("Only CSV and Excel files are supported"); return; }
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Upload failed"); }
      const data = await res.json();
      setProject(data.projectId, data.fileName);
      addProject({ projectId: data.projectId, fileName: data.fileName, createdAt: new Date().toISOString() });
      navigate("/analysis");
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };
  const handleBrowse = () => fileInputRef.current?.click();
  const handleFileInput = (e) => { const file = e.target.files[0]; if (file) handleFile(file); };

  // ── DB handlers ───────────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    setConnectionError(null);
    setConnectionSuccess(false);
    setDbTables([]);
    setSelectedTable("");
    setIsTestingConnection(true);
    const cs = getConnectionString();
    setConnectionString(cs);

    try {
      const res = await fetch(`${API_URL}/api/connect/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: cs }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDbTables(data.tables);
      setConnectionSuccess(true);
    } catch (err) {
      setConnectionError(err.message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAnalyzeTable = async () => {
    if (!selectedTable) { setConnectionError("Please select a table to analyze"); return; }
    setConnectionError(null);
    setIsConnecting(true);

    try {
      const introspectRes = await fetch(`${API_URL}/api/connect/introspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString, tableName: selectedTable }),
      });
      const introspectData = await introspectRes.json();
      if (!introspectData.success) throw new Error(introspectData.error);

      const pipelineRes = await fetch(`${API_URL}/api/connect/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName: selectedTable, fields: introspectData.fields }),
      });
      if (!pipelineRes.ok) { const d = await pipelineRes.json(); throw new Error(d.error || "Analysis failed"); }
      const pipelineData = await pipelineRes.json();

      setProject(pipelineData.projectId, pipelineData.fileName);
      addProject({ projectId: pipelineData.projectId, fileName: pipelineData.fileName, createdAt: new Date().toISOString() });
      navigate("/analysis");
    } catch (err) {
      setConnectionError(err.message);
      setIsConnecting(false);
    }
  };

  const handleAnalyzeAll = async () => {
    setConnectionError(null);
    setIsAnalyzingAll(true);

    try {
      const res = await fetch(`${API_URL}/api/connect/analyze-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString,
          tables: dbTables.map((t) => t.name),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Analysis failed"); }
      const data = await res.json();

      setProject(data.projectId, data.fileName);
      addProject({ projectId: data.projectId, fileName: data.fileName, createdAt: new Date().toISOString() });
      navigate("/analysis");
    } catch (err) {
      setConnectionError(err.message);
      setIsAnalyzingAll(false);
    }
  };

  const databases = [
    { name: "PostgreSQL", gradient: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/40", text: "text-blue-400" },
    { name: "MySQL",      gradient: "from-orange-500/20 to-orange-600/20", border: "border-orange-500/40", text: "text-orange-400" },
    { name: "Snowflake",  gradient: "from-cyan-500/20 to-cyan-600/20", border: "border-cyan-500/40", text: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen relative bg-ds-background">
      <NeuralBackground />
      <Sidebar />
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />

      <div className="ml-72 relative z-10">
        <Navbar />
        <main className="p-8 pb-16">
          <div className="max-w-4xl mx-auto">

            <div className="mb-6">
              <h1 className="text-4xl font-bold text-ds-text-primary mb-2">Create New Project</h1>
              <p className="text-ds-text-muted">Upload your dataset or connect to a database to get started</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-ds-error/10 border border-ds-error/30 rounded-xl text-ds-error text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Upload Zone */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-b from-ds-primary/10 to-transparent rounded-2xl blur-2xl pointer-events-none" />
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={!isUploading ? handleBrowse : undefined}
                className={`relative bg-ds-surface backdrop-blur-xl border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
                  ${isUploading ? "cursor-wait opacity-80" : "cursor-pointer"}
                  ${isDragging ? "border-ds-primary bg-ds-primary/5 scale-[1.01] shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "border-ds-border hover:border-ds-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"}`}
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 blur-2xl bg-ds-primary/20 rounded-full" />
                  <div className={`relative w-16 h-16 mx-auto bg-gradient-to-br from-ds-primary/20 to-ds-secondary/20 rounded-2xl flex items-center justify-center transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                    {isUploading ? <div className="w-7 h-7 border-2 border-ds-primary border-t-transparent rounded-full animate-spin" /> : <UploadIcon className="w-8 h-8 text-ds-primary" />}
                  </div>
                </div>
                <div className="space-y-1 mb-5">
                  <h3 className="text-xl font-bold text-ds-text-primary">{isUploading ? "Uploading your file..." : "Drop your CSV or Excel file here"}</h3>
                  <p className="text-ds-text-muted text-sm">{isUploading ? "Please wait while we process your file" : "or click to browse files"}</p>
                </div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  {["CSV", "XLSX", "XLS"].map((fmt) => (
                    <span key={fmt} className="px-3 py-1.5 bg-ds-primary/10 border border-ds-primary/30 rounded-lg text-xs font-mono text-ds-primary">{fmt}</span>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mb-5 text-sm text-ds-text-muted">
                  <span>Maximum file size: 50MB</span><span>•</span><span>Data processed securely</span>
                </div>
                {!isUploading && (
                  <GlowButton variant="primary" onClick={(e) => { e.stopPropagation(); handleBrowse(); }}>Browse Files</GlowButton>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ds-border" /></div>
              <div className="relative flex justify-center"><span className="px-4 bg-ds-background text-ds-text-muted text-sm font-medium">OR</span></div>
            </div>

            {/* Database Connection */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-ds-secondary/5 to-transparent rounded-2xl blur-2xl pointer-events-none" />
              <div className="relative bg-ds-surface backdrop-blur-xl border border-ds-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-ds-secondary/20 to-ds-primary/20 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-ds-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ds-text-primary">Connect to Database</h3>
                    <p className="text-sm text-ds-text-muted">Connect any Supabase project to analyze its schema</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {databases.map((db) => (
                    <button key={db.name} onClick={() => setSelectedDb(db.name)}
                      className={`p-4 bg-ds-surface-solid border rounded-xl transition-all duration-200 group ${selectedDb === db.name ? `${db.border} bg-ds-primary/5` : "border-ds-border hover:border-ds-primary/40"}`}>
                      <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-br ${db.gradient} rounded-lg flex items-center justify-center`}>
                        <Database className={`w-5 h-5 ${db.text}`} />
                      </div>
                      <div className={`text-xs font-medium transition-colors ${selectedDb === db.name ? "text-ds-text-primary" : "text-ds-text-muted group-hover:text-ds-text-primary"}`}>{db.name}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ds-text-primary mb-2">Supabase Project URL</label>
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={(e) => { setSupabaseUrl(e.target.value); setConnectionSuccess(false); setDbTables([]); setSelectedTable(""); }}
                        placeholder="https://yourproject.supabase.co"
                        className="w-full bg-ds-surface-solid border border-ds-border rounded-lg px-4 py-3 text-sm font-mono text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ds-text-primary mb-2">Anon / Public Key</label>
                      <input
                        type="text"
                        value={supabaseKey}
                        onChange={(e) => { setSupabaseKey(e.target.value); setConnectionSuccess(false); setDbTables([]); setSelectedTable(""); }}
                        placeholder="sb_publishable_xxxxxxxxxxxx"
                        className="w-full bg-ds-surface-solid border border-ds-border rounded-lg px-4 py-3 text-sm font-mono text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-ds-text-muted">
                    Leave both fields empty to use the demo BikeStores database
                  </p>

                  {connectionError && (
                    <div className="p-3 bg-ds-error/10 border border-ds-error/30 rounded-lg text-ds-error text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{connectionError}
                    </div>
                  )}

                  {connectionSuccess && dbTables.length > 0 && (
                    <div className="p-4 bg-ds-success/10 border border-ds-success/30 rounded-lg space-y-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-ds-success" />
                        <span className="text-ds-success text-sm font-medium">Connected! Found {dbTables.length} tables</span>
                      </div>

                      {/* Table list preview */}
                      <div className="flex flex-wrap gap-2">
                        {dbTables.map((t) => (
                          <span key={t.name} className="px-2 py-1 bg-ds-surface border border-ds-border rounded-lg text-xs text-ds-text-muted font-mono">
                            {t.name} <span className="text-ds-primary">({t.columnCount})</span>
                          </span>
                        ))}
                      </div>

                      {/* Analyze all button — prominent */}
                      <button
                        onClick={handleAnalyzeAll}
                        disabled={isAnalyzingAll || isConnecting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-ds-primary to-ds-secondary text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {isAnalyzingAll
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing all {dbTables.length} tables...</>
                          : <><Layers className="w-4 h-4" />Analyze Entire Database ({dbTables.length} tables)</>
                        }
                      </button>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ds-border" /></div>
                        <div className="relative flex justify-center"><span className="px-3 bg-ds-surface text-ds-text-muted text-xs">or analyze a single table</span></div>
                      </div>

                      {/* Single table selector */}
                      <div>
                        <label className="block text-sm font-medium text-ds-text-primary mb-2">Select a specific table</label>
                        <div className="relative">
                          <select
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                            className="w-full bg-ds-surface-solid border border-ds-border rounded-lg px-4 py-3 text-sm text-ds-text-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all appearance-none cursor-pointer"
                          >
                            <option value="">— Choose a table —</option>
                            {dbTables.map((t) => (
                              <option key={t.name} value={t.name}>{t.name} ({t.columnCount} columns)</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-text-muted pointer-events-none" />
                        </div>
                      </div>

                      <button
                        onClick={handleAnalyzeTable}
                        disabled={!selectedTable || isConnecting || isAnalyzingAll}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ds-surface-solid border border-ds-border rounded-xl text-sm font-medium text-ds-text-primary hover:border-ds-primary/50 hover:bg-ds-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {isConnecting ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Database className="w-4 h-4" />Analyze Selected Table</>}
                      </button>
                    </div>
                  )}

                  {/* Test connection button */}
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || isConnecting || isAnalyzingAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ds-surface-solid border border-ds-border rounded-xl text-sm font-medium text-ds-text-primary hover:border-ds-primary/50 hover:bg-ds-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isTestingConnection ? <><Loader2 className="w-4 h-4 animate-spin" />Testing connection...</> : <><Database className="w-4 h-4" />Test Connection</>}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}