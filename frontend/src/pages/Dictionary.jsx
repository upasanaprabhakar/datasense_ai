import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { LineageGraph } from "../components/LineageGraph";
import { DatasetSummary, ConfidenceTooltip } from "../components/DatasetSummaryAndTooltip";
import { NeuralBackground } from "../components/NeuralBackground";
import { Download, FileJson, FileText, Search, Check, X, Edit3, Upload, AlertTriangle } from "lucide-react";
import { GlowButton } from "../components/GlowButton";
import { useState, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import { useNavigate } from "react-router";
import { exportJSON, exportMarkdown, exportPDF } from "../utils/exportUtils";
import { PIIBadge, GDPRComplianceBanner, PIIRiskIndicator } from "../components/PIIBadge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const dataTypeColors = {
  integer:  "bg-ds-secondary/20 text-ds-secondary border border-ds-secondary/30",
  string:   "bg-ds-primary/20 text-ds-primary border border-ds-primary/30",
  datetime: "bg-teal-500/20 text-teal-400 border border-teal-500/30",
  decimal:  "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  boolean:  "bg-pink-500/20 text-pink-400 border border-pink-500/30",
  email:    "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  unknown:  "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const statusColors = {
  approved: "bg-ds-success/20 text-ds-success",
  pending:  "bg-ds-warning/20 text-ds-warning",
  rejected: "bg-ds-error/20 text-ds-error",
};

function getQualityColor(q) {
  if (q >= 90) return "text-ds-success";
  if (q >= 75) return "text-ds-warning";
  return "text-ds-error";
}

function getQualityBarColor(q) {
  if (q >= 90) return "bg-ds-success";
  if (q >= 75) return "bg-ds-warning";
  return "bg-ds-error";
}

function NoProjectState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      <div className="w-20 h-20 rounded-2xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center mb-6">
        <FileJson className="w-10 h-10 text-ds-primary/50" />
      </div>
      <h2 className="text-2xl font-bold text-ds-text-primary mb-3">No Dictionary Yet</h2>
      <p className="text-ds-text-muted mb-8 max-w-sm">
        Upload a dataset first and let the AI agents analyze it. Your data dictionary will appear here.
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

export function Dictionary() {
  const navigate = useNavigate();
  const { projectId, fileName, setDictionary } = useProjectStore();

  const [fields, setFields]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // KEY FIX: always fetch fresh from API when projectId changes
  // Never rely on stale Zustand dictionary — it causes "No Dictionary" after clicking from dashboard
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    setFields([]);

    const fetchDictionary = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dictionary/${projectId}`);

        // If still processing, show loading
        if (res.status === 202) {
          setError("Analysis still in progress. Please wait...");
          return;
        }

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to load dictionary");
        }

        const data = await res.json();
        const fetchedFields = data.fields || [];
        setFields(fetchedFields);
        setDictionary(fetchedFields);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDictionary();
  }, [projectId]); // only re-run when projectId changes — NOT on dictionary change

  const updateFieldStatus = async (fieldName, status) => {
    const updated = fields.map((f) => f.fieldName === fieldName ? { ...f, status } : f);
    setFields(updated);
    setDictionary(updated);
    try {
      await fetch(`${API_URL}/api/dictionary/${projectId}/field/${fieldName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Update failed:", err.message);
    }
  };

  const avgQuality = fields.length > 0
    ? Math.round(fields.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / fields.length)
    : 0;
  const circumference = 2 * Math.PI * 32;

  const filtered = fields.filter((row) => {
    const matchSearch =
      (row.fieldName || "").toLowerCase().includes(search.toLowerCase()) ||
      (row.description || "").toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "All Types" || row.detectedType === typeFilter;
    const matchStatus = statusFilter === "All Status" || row.status === statusFilter.toLowerCase();
    return matchSearch && matchType && matchStatus;
  });

  const selectedData = fields.find((f) => f.fieldName === selectedRow);

  return (
    <div className="min-h-screen relative bg-ds-background">
      <NeuralBackground />
      <Sidebar />

      <div className={`relative z-10 transition-all duration-300 ${selectedRow ? "mr-96" : ""} ml-72`}>
        <Navbar />
        <main className="p-8">

          {!projectId && <NoProjectState />}

          {projectId && loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-12 h-12 border-2 border-ds-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-ds-text-muted">Loading your data dictionary...</p>
            </div>
          )}

          {projectId && error && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="p-6 bg-ds-error/10 border border-ds-error/30 rounded-xl text-center max-w-md">
                <p className="text-ds-error font-medium mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetch(`${API_URL}/api/dictionary/${projectId}`)
                      .then(r => r.json())
                      .then(d => { setFields(d.fields || []); setDictionary(d.fields || []); })
                      .catch(e => setError(e.message))
                      .finally(() => setLoading(false));
                  }}
                  className="px-4 py-2 bg-ds-primary/20 border border-ds-primary/30 text-ds-primary rounded-lg text-sm hover:bg-ds-primary/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {projectId && !loading && !error && (
            <>
              <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-4xl font-bold text-ds-text-primary mb-2">Data Dictionary</h1>
                  <div className="flex items-center gap-3">
                    <p className="text-ds-text-muted text-sm">
                      {fileName && <span className="font-mono text-ds-primary/70 mr-1">{fileName}</span>}
                      · {fields.length} fields analyzed
                    </p>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-ds-success rounded-full animate-pulse" />
                      <span className="text-ds-success font-medium">Live</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <GlowButton variant="secondary" icon={FileJson} size="sm" onClick={() => exportJSON(fields, fileName)}>Export JSON</GlowButton>
                  <GlowButton variant="secondary" icon={FileText} size="sm" onClick={() => exportMarkdown(fields, fileName)}>Export MD</GlowButton>
                  <GlowButton variant="primary" icon={Download} size="sm" onClick={() => exportPDF(fields, fileName)}>Export PDF</GlowButton>
                </div>
              </div>

              {/* Quality Score Banner */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-ds-success/10 to-transparent rounded-xl blur-xl pointer-events-none" />
                <div className="relative bg-ds-surface backdrop-blur-xl border border-ds-success/30 rounded-xl p-5">
                  <div className="flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="32" stroke="#1e1e3f" strokeWidth="6" fill="none" />
                          <circle cx="40" cy="40" r="32" stroke="#22c55e" strokeWidth="6" fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - avgQuality / 100)}
                            strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-ds-success">{avgQuality}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-ds-text-primary mb-1">
                          {avgQuality >= 85 ? "Excellent" : avgQuality >= 70 ? "Good" : "Needs Review"} Quality Score
                        </h3>
                        <p className="text-sm text-ds-text-muted max-w-sm">AI-generated descriptions with quality assessment complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      {[
                        { label: "Approved", status: "approved", color: "text-ds-success" },
                        { label: "Pending",  status: "pending",  color: "text-ds-warning" },
                        { label: "Rejected", status: "rejected", color: "text-ds-error" },
                      ].map(({ label, status, color }) => (
                        <div key={status} className="text-center">
                          <div className={`text-2xl font-bold ${color}`}>{fields.filter(f => f.status === status).length}</div>
                          <div className="text-xs text-ds-text-muted mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DatasetSummary fields={fields} fileName={fileName} />

              {/* Filters */}
              <div className="flex flex-col gap-3 mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-text-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search fields or descriptions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-ds-surface border border-ds-border rounded-lg pl-10 pr-4 py-2 text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["All", "string", "integer", "datetime", "boolean", "decimal", "email"].map((t) => (
                    <button key={t}
                      onClick={() => setTypeFilter(t === "All" ? "All Types" : t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        (t === "All" && typeFilter === "All Types") || typeFilter === t
                          ? "bg-ds-primary/20 border-ds-primary/50 text-ds-primary"
                          : "bg-ds-surface border-ds-border text-ds-text-muted hover:text-ds-text-primary hover:border-ds-primary/30"
                      }`}
                    >{t === "All" ? "All Types" : t}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: "All",      value: "All Status", active: "bg-ds-surface border-ds-border text-ds-text-primary" },
                    { label: "Approved", value: "Approved",   active: "bg-ds-success/20 border-ds-success/50 text-ds-success" },
                    { label: "Pending",  value: "Pending",    active: "bg-ds-warning/20 border-ds-warning/50 text-ds-warning" },
                    { label: "Rejected", value: "Rejected",   active: "bg-ds-error/20 border-ds-error/50 text-ds-error" },
                  ].map(({ label, value, active }) => (
                    <button key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        statusFilter === value
                          ? active
                          : "bg-ds-surface border-ds-border text-ds-text-muted hover:text-ds-text-primary hover:border-ds-primary/30"
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <GDPRComplianceBanner dictionary={filtered} />

              {fields.filter(f => f.issues?.length > 0 || parseFloat(f.nullRate) > 30).length > 0 && (
                <div className="mb-5 p-4 bg-ds-error/5 border border-ds-error/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-ds-error flex-shrink-0" />
                    <span className="text-sm font-semibold text-ds-error">
                      {fields.filter(f => f.issues?.length > 0 || parseFloat(f.nullRate) > 30).length} fields need attention
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fields.filter(f => f.issues?.length > 0 || parseFloat(f.nullRate) > 30).map(f => (
                      <button
                        key={f.fieldName}
                        onClick={() => setSelectedRow(f.fieldName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-ds-error/10 border border-ds-error/20 rounded-lg text-xs text-ds-error hover:bg-ds-error/20 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-mono font-medium">{f.fieldName}</span>
                        <span className="text-ds-error/60">
                          {parseFloat(f.nullRate) > 30 ? `${f.nullRate}% nulls` : f.issues?.[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lineage Graph */}
              <div className="mb-6">
                <LineageGraph fields={fields} onSelectField={(fieldName) => setSelectedRow(fieldName)} />
              </div>

              {/* Dictionary Table */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-ds-surface/30 to-transparent rounded-xl blur-xl pointer-events-none" />
                <div className="relative bg-ds-surface backdrop-blur-xl border border-ds-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-ds-border">
                          {["Field Name","Data Type","Description","Quality","Confidence","Status","Actions"].map((h) => (
                            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-ds-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((row, index) => (
                          <tr
                            key={row.fieldName}
                            id={`field-${row.fieldName}`}
                            onClick={() => setSelectedRow(selectedRow === row.fieldName ? null : row.fieldName)}
                            className={`relative border-b border-ds-border/50 cursor-pointer transition-all duration-150
                              ${index % 2 === 0 ? "bg-ds-background/20" : "bg-transparent"}
                              hover:bg-ds-primary/5
                              ${selectedRow === row.fieldName ? "bg-ds-primary/10" : ""}
                              ${row.status === "rejected" ? "border-l-2 border-l-ds-error" : ""}
                            `}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-ds-primary font-medium whitespace-nowrap">{row.fieldName}</span>
                                <PIIBadge field={row} size="xs" />
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${dataTypeColors[row.detectedType] || dataTypeColors.unknown}`}>{row.detectedType}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-ds-text-muted max-w-xs">
                              <span className="line-clamp-2">{row.description || "—"}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-ds-surface-solid rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${getQualityBarColor(row.qualityScore)}`} style={{ width: `${row.qualityScore}%` }} />
                                </div>
                                <span className={`text-xs font-semibold ${getQualityColor(row.qualityScore)}`}>{row.qualityScore}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <ConfidenceTooltip field={row} />
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[row.status]}`}>{row.status}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-ds-primary/10 transition-colors group">
                                  <Edit3 className="w-3.5 h-3.5 text-ds-text-muted group-hover:text-ds-primary transition-colors" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); updateFieldStatus(row.fieldName, "approved"); }} className="p-1.5 rounded-lg hover:bg-ds-success/10 transition-colors group">
                                  <Check className="w-3.5 h-3.5 text-ds-text-muted group-hover:text-ds-success transition-colors" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); updateFieldStatus(row.fieldName, "rejected"); }} className="p-1.5 rounded-lg hover:bg-ds-error/10 transition-colors group">
                                  <X className="w-3.5 h-3.5 text-ds-text-muted group-hover:text-ds-error transition-colors" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr><td colSpan={7} className="px-5 py-12 text-center text-ds-text-muted text-sm">No fields match your search</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-ds-border flex items-center justify-between">
                    <span className="text-xs text-ds-text-muted">Showing {filtered.length} of {fields.length} fields</span>
                    <span className="text-xs text-ds-text-muted">Analyzed by Atlas, Sage & Guardian</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-screen w-96 bg-ds-surface-solid/95 backdrop-blur-xl border-l border-ds-border shadow-2xl z-50 transition-transform duration-300 ${selectedRow ? "translate-x-0" : "translate-x-full"}`}>
        {selectedData && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-ds-text-primary">Field Details</h3>
              <button onClick={() => setSelectedRow(null)} className="p-2 rounded-lg hover:bg-ds-surface transition-colors">
                <X className="w-5 h-5 text-ds-text-muted" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">Field Name</label>
                <div className="text-lg font-mono text-ds-primary font-semibold">{selectedData.fieldName}</div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">Data Type</label>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${dataTypeColors[selectedData.detectedType] || dataTypeColors.unknown}`}>{selectedData.detectedType}</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">Status</label>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[selectedData.status]}`}>{selectedData.status}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">AI Description</label>
                <textarea className="w-full bg-ds-surface border border-ds-border rounded-lg px-3 py-2.5 text-sm text-ds-text-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary transition-all resize-none" rows={3} defaultValue={selectedData.description} />
              </div>
              <div>
                <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">Sample Values</label>
                <div className="bg-ds-surface border border-ds-border rounded-lg p-3 space-y-1.5 font-mono text-xs text-ds-text-muted">
                  {selectedData.sampleValues?.slice(0, 5).map((v, i) => <div key={i}>{String(v)}</div>) || <div>—</div>}
                </div>
              </div>
              {selectedData.hasPII && (
                <div>
                  <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">GDPR Compliance</label>
                  <PIIRiskIndicator field={selectedData} />
                </div>
              )}
              <div>
                <label className="block text-xs text-ds-text-muted mb-1.5 uppercase tracking-wider">Statistical Analysis</label>
                <div className="bg-ds-surface border border-ds-border rounded-lg p-3 space-y-2.5 text-sm">
                  {[
                    { label: "Quality Score", value: `${selectedData.qualityScore}%`, className: getQualityColor(selectedData.qualityScore) },
                    { label: "Confidence",    value: `${selectedData.confidence}%`,   className: "text-ds-text-primary" },
                    { label: "Unique values", value: selectedData.uniqueCount,        className: "text-ds-text-primary" },
                    { label: "Null rate",     value: `${selectedData.nullRate}%`,     className: "text-ds-text-primary" },
                    { label: "Primary Key",   value: selectedData.isPrimaryKey ? "Yes" : "No", className: selectedData.isPrimaryKey ? "text-ds-success" : "text-ds-text-muted" },
                  ].map(({ label, value, className }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-ds-text-muted">{label}</span>
                      <span className={`font-semibold ${className}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => updateFieldStatus(selectedData.fieldName, "approved")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ds-success/10 border border-ds-success/30 text-ds-success text-sm font-medium hover:bg-ds-success/20 transition-colors">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => updateFieldStatus(selectedData.fieldName, "rejected")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ds-error/10 border border-ds-error/30 text-ds-error text-sm font-medium hover:bg-ds-error/20 transition-colors">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}