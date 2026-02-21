import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { NeuralBackground } from "../components/NeuralBackground";
import { useNavigate } from "react-router";
import { useProjectStore } from "../stores/projectStore";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, Database, TrendingUp, FileText, Zap, ChevronRight, CheckCircle, Clock, AlertCircle, Plus, BarChart3, Trash2, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTimeAgo(iso) {
  if (!iso) return "just now";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ icon: Icon, label, value, sub, color, glow }) {
  return (
    <div className={`relative bg-ds-surface backdrop-blur-xl border border-ds-border rounded-2xl p-6 overflow-hidden group hover:${glow} transition-all duration-300`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${glow} blur-xl`} />
      <div className="relative z-10">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold text-ds-text-primary mb-1">{value}</div>
        <div className="text-sm font-medium text-ds-text-primary mb-1">{label}</div>
        {sub && <div className="text-xs text-ds-text-muted">{sub}</div>}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ project, onConfirm, onCancel }) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="bg-[#13151f] border border-ds-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ds-text-primary">Delete Project?</h3>
              <p className="text-xs text-ds-text-muted mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-ds-text-muted" />
          </button>
        </div>

        {/* Info box */}
        <div className="bg-ds-surface border border-ds-border rounded-xl p-4 mb-5">
          <p className="text-xs text-ds-text-muted mb-1">File to be deleted</p>
          <p className="text-sm font-mono text-ds-primary font-semibold truncate">{project.fileName}</p>
          {project.totalFields > 0 && (
            <p className="text-xs text-ds-text-muted mt-2">
              {project.totalFields} field{project.totalFields !== 1 ? "s" : ""} will be permanently removed
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-ds-surface border border-ds-border text-ds-text-primary rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500/90 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProjectRow({ project, onClick, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const statusIcon = {
    complete:  <CheckCircle className="w-4 h-4 text-ds-success" />,
    analyzing: <Clock className="w-4 h-4 text-ds-warning animate-spin" />,
    error:     <AlertCircle className="w-4 h-4 text-ds-error" />,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    await onDelete(project.projectId);
  };

  return (
    <>
      <div
        onClick={onClick}
        className="flex items-center gap-4 px-5 py-4 hover:bg-ds-primary/5 border-b border-ds-border/50 cursor-pointer transition-all group last:border-0"
      >
        <div className="w-10 h-10 rounded-xl bg-ds-primary/10 border border-ds-primary/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-ds-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ds-text-primary truncate">{project.fileName}</div>
          <div className="text-xs text-ds-text-muted mt-0.5">{getTimeAgo(project.createdAt)}</div>
        </div>
        {project.totalFields > 0 && (
          <div className="text-xs text-ds-text-muted flex-shrink-0">
            {project.totalFields} fields
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusIcon[project.status] || statusIcon.complete}
          <span className={`text-xs font-medium capitalize ${
            project.status === "complete"  ? "text-ds-success" :
            project.status === "analyzing" ? "text-ds-warning" : "text-ds-error"
          }`}>{project.status || "complete"}</span>
        </div>
        
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-ds-error/10 transition-all flex-shrink-0"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4 text-ds-error" />
        </button>
        
        <ChevronRight className="w-4 h-4 text-ds-text-muted/40 group-hover:text-ds-primary transition-colors flex-shrink-0" />
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          project={project}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="relative w-32 h-32 mb-8">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </radialGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="url(#bg-grad)" />
          <ellipse cx="64" cy="44" rx="32" ry="10" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="2" />
          <rect x="32" y="44" width="64" height="24" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
          <ellipse cx="64" cy="68" rx="32" ry="10" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" />
          <rect x="32" y="68" width="64" height="20" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
          <ellipse cx="64" cy="88" rx="32" ry="10" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
          <circle cx="64" cy="44" r="3" fill="rgba(99,102,241,0.8)">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="96" cy="64" r="2" fill="rgba(139,92,246,0.8)">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="32" cy="74" r="2" fill="rgba(99,102,241,0.6)">
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-ds-text-primary mb-2">No Projects Yet</h3>
      <p className="text-sm text-ds-text-muted mb-8 max-w-xs">
        Upload a CSV or Excel file to generate your first AI-powered data dictionary
      </p>
      <button
        onClick={() => navigate("/upload")}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ds-primary to-ds-secondary text-white rounded-xl font-medium hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all"
      >
        <Plus className="w-5 h-5" />
        Create New Project
      </button>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {["Auto Schema Analysis", "Smart Descriptions", "Quality Scoring"].map((f) => (
          <span key={f} className="px-3 py-1.5 bg-ds-surface border border-ds-border rounded-full text-xs text-ds-text-muted">{f}</span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { projectId, fileName, totalFields, dictionary, status, setProjectId, setFileName, deleteProject: deleteFromStore } = useProjectStore();

  const [dbProjects, setDbProjects] = useState([]);
  const [loadingProjects, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();

        const normalized = (data.projects || []).map((p) => ({
          projectId:   p.project_id,
          fileName:    p.file_name,
          totalFields: p.total_fields,
          avgQuality:  p.avg_quality,
          status:      p.status,
          createdAt:   p.created_at,
        }));
        setDbProjects(normalized);
      } catch (err) {
        console.error("Failed to load projects:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      deleteFromStore(projectId);
      setDbProjects(prev => prev.filter(p => p.projectId !== projectId));
    } catch (err) {
      console.error('Delete failed:', err.message);
      alert('Failed to delete project. Please try again.');
    }
  };

  const totalProjects = dbProjects.length;
  const totalFieldsAll = dbProjects.reduce((s, p) => s + (p.totalFields || 0), 0) || totalFields || 0;
  const avgQualityAll = dbProjects.length > 0
    ? Math.round(dbProjects.reduce((s, p) => s + (p.avgQuality || 0), 0) / dbProjects.length)
    : null;

  const currentAvgQuality = dictionary?.length > 0
    ? Math.round(dictionary.reduce((s, f) => s + (f.qualityScore || 0), 0) / dictionary.length)
    : null;

  const displayAvgQuality = avgQualityAll ?? currentAvgQuality;
  const approvedCount = dictionary?.filter(f => f.status === "approved").length || 0;

  const allProjects = dbProjects.length > 0
    ? dbProjects
    : projectId
      ? [{ projectId, fileName, totalFields, status: status || "complete", createdAt: new Date().toISOString() }]
      : [];

  const recentActivity = allProjects.slice(0, 5);

  const handleProjectClick = (project) => {
    setProjectId(project.projectId);
    setFileName(project.fileName);
    navigate(project.status === "complete" ? "/dictionary" : "/analysis");
  };

  return (
    <div className="min-h-screen relative bg-ds-background">
      <NeuralBackground />
      <Sidebar />

      <div className="ml-72 relative z-10">
        <Navbar />
        <main className="p-8">

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-ds-text-primary mb-2">
                {getGreeting()}, John
              </h1>
              <p className="text-ds-text-muted">
                {totalProjects === 0
                  ? "Ready to analyze your first dataset?"
                  : `You have ${totalProjects} project${totalProjects !== 1 ? "s" : ""} in your workspace`}
              </p>
            </div>
            <button
              onClick={() => navigate("/upload")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ds-primary to-ds-secondary text-white rounded-xl text-sm font-medium hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard icon={Database} label="Total Projects" value={totalProjects} sub={totalProjects === 0 ? "Start your first one" : `${totalProjects} dataset${totalProjects !== 1 ? "s" : ""} analyzed`} color="bg-gradient-to-br from-ds-primary to-ds-secondary" glow="shadow-[0_0_20px_rgba(99,102,241,0.2)]" />
            <StatCard icon={FileText} label="Fields Documented" value={totalFieldsAll} sub={totalFieldsAll > 0 ? "Across all projects" : "No fields yet"} color="bg-gradient-to-br from-violet-500 to-purple-600" glow="shadow-[0_0_20px_rgba(139,92,246,0.2)]" />
            <StatCard icon={TrendingUp} label="Avg Quality Score" value={displayAvgQuality !== null ? `${displayAvgQuality}%` : "—"} sub={displayAvgQuality !== null ? displayAvgQuality >= 85 ? "Excellent quality" : displayAvgQuality >= 70 ? "Good quality" : "Needs review" : "Upload data first"} color="bg-gradient-to-br from-emerald-500 to-teal-600" glow="shadow-[0_0_20px_rgba(34,197,94,0.2)]" />
            <StatCard icon={BarChart3} label="Fields Approved" value={approvedCount} sub={dictionary?.length > 0 ? `of ${dictionary.length} total fields` : "No data yet"} color="bg-gradient-to-br from-blue-500 to-cyan-600" glow="shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-ds-surface backdrop-blur-xl border border-ds-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-ds-primary rounded-full animate-pulse" />
                    <h2 className="text-sm font-bold text-ds-text-primary uppercase tracking-wider">Recent Projects</h2>
                  </div>
                  {allProjects.length > 0 && (
                    <button onClick={() => navigate("/upload")} className="text-xs text-ds-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>

                {loadingProjects ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <div className="w-6 h-6 border-2 border-ds-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-ds-text-muted">Loading projects...</span>
                  </div>
                ) : allProjects.length === 0 ? (
                  <EmptyState navigate={navigate} />
                ) : (
                  <div>
                    {recentActivity.map((project) => (
                      <ProjectRow
                        key={project.projectId}
                        project={project}
                        onClick={() => handleProjectClick(project)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-ds-surface backdrop-blur-xl border border-ds-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-ds-border">
                  <h2 className="text-sm font-bold text-ds-text-primary uppercase tracking-wider">Quick Actions</h2>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { icon: Upload, label: "Upload Dataset", sub: "CSV or Excel file", path: "/upload", color: "text-ds-primary", bg: "bg-ds-primary/10" },
                    { icon: Database, label: "View Dictionary", sub: "Browse field docs", path: "/dictionary", color: "text-ds-secondary", bg: "bg-ds-secondary/10" },
                    { icon: Zap, label: "Ask AI Assistant", sub: "Chat with your data", path: "/chat", color: "text-ds-success", bg: "bg-ds-success/10" },
                  ].map(({ icon: Icon, label, sub, path, color, bg }) => (
                    <button key={path} onClick={() => navigate(path)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-ds-primary/5 transition-all group text-left">
                      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ds-text-primary">{label}</div>
                        <div className="text-xs text-ds-text-muted">{sub}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ds-text-muted/30 group-hover:text-ds-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {projectId && (
                <div className="bg-ds-surface backdrop-blur-xl border border-ds-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-ds-border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-ds-success rounded-full animate-pulse" />
                      <h2 className="text-sm font-bold text-ds-text-primary uppercase tracking-wider">Active Project</h2>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="text-xs text-ds-text-muted mb-1">File</div>
                      <div className="text-sm font-mono text-ds-primary truncate">{fileName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-ds-surface-solid rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-ds-text-primary">{totalFields}</div>
                        <div className="text-xs text-ds-text-muted mt-0.5">Fields</div>
                      </div>
                      <div className="bg-ds-surface-solid rounded-lg p-3 text-center">
                        <div className={`text-xl font-bold ${currentAvgQuality >= 85 ? "text-ds-success" : currentAvgQuality >= 70 ? "text-ds-warning" : "text-ds-text-muted"}`}>
                          {currentAvgQuality !== null ? `${currentAvgQuality}%` : "—"}
                        </div>
                        <div className="text-xs text-ds-text-muted mt-0.5">Quality</div>
                      </div>
                    </div>
                    <button onClick={() => navigate("/dictionary")} className="w-full py-2.5 bg-ds-primary/10 border border-ds-primary/30 text-ds-primary rounded-xl text-sm font-medium hover:bg-ds-primary/20 transition-colors">
                      View Dictionary →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}