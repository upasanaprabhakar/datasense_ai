// ─── Dataset Summary Component ───────────────────────────────────────────────
export function DatasetSummary({ fields, fileName }) {
  if (!fields || fields.length === 0) return null;

  const typeCounts = fields.reduce((acc, f) => {
    acc[f.detectedType] = (acc[f.detectedType] || 0) + 1;
    return acc;
  }, {});

  const piiCount     = fields.filter(f => f.hasPII).length;
  const pkCount      = fields.filter(f => f.isPrimaryKey).length;
  const fkCount      = fields.filter(f => f.isForeignKey).length;
  const issueCount   = fields.filter(f => f.issues?.length > 0).length;
  const avgQuality   = Math.round(fields.reduce((s, f) => s + (f.qualityScore || 0), 0) / fields.length);
  const avgNullRate  = (fields.reduce((s, f) => s + (parseFloat(f.nullRate) || 0), 0) / fields.length).toFixed(1);

  const typeColors = {
    integer:  "bg-ds-secondary/20 text-ds-secondary",
    string:   "bg-ds-primary/20 text-ds-primary",
    datetime: "bg-teal-500/20 text-teal-400",
    decimal:  "bg-orange-500/20 text-orange-400",
    boolean:  "bg-pink-500/20 text-pink-400",
    email:    "bg-blue-500/20 text-blue-400",
    unknown:  "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="bg-ds-surface backdrop-blur-xl border border-ds-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ds-text-primary">Dataset Summary</h3>
        {fileName && <span className="text-xs font-mono text-ds-primary/60">{fileName}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Fields",   value: fields.length,   color: "text-ds-primary" },
          { label: "Avg Quality",    value: `${avgQuality}%`, color: avgQuality >= 85 ? "text-ds-success" : avgQuality >= 70 ? "text-ds-warning" : "text-ds-error" },
          { label: "Avg Null Rate",  value: `${avgNullRate}%`, color: parseFloat(avgNullRate) > 20 ? "text-ds-error" : "text-ds-success" },
          { label: "Fields w/ Issues", value: issueCount,    color: issueCount > 0 ? "text-ds-warning" : "text-ds-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-ds-background/40 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-ds-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-2">Field Types</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span key={type} className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type] || typeColors.unknown}`}>
                {type} <span className="opacity-70">×{count}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-2">Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {pkCount > 0 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                🔑 {pkCount} Primary Key{pkCount > 1 ? "s" : ""}
              </span>
            )}
            {fkCount > 0 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                🔗 {fkCount} Foreign Key{fkCount > 1 ? "s" : ""}
              </span>
            )}
            {piiCount > 0 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                ⚠ {piiCount} PII Field{piiCount > 1 ? "s" : ""}
              </span>
            )}
            {piiCount === 0 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-ds-success/20 text-ds-success">
                ✓ No PII Detected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Confidence Tooltip Component ────────────────────────────────────────────
import { useState } from "react";

function buildConfidenceBreakdown(field) {
  const reasons = [];
  let base = 50;

  if (field.sampleValues && field.sampleValues.length >= 5) {
    reasons.push({ label: "Rich sample data", value: "+20", positive: true });
    base += 20;
  } else if (field.sampleValues && field.sampleValues.length >= 3) {
    reasons.push({ label: "Adequate sample data", value: "+10", positive: true });
    base += 10;
  } else {
    reasons.push({ label: "Low sample count", value: "+0", positive: false });
  }

  if (parseFloat(field.nullRate) < 0.1) {
    reasons.push({ label: "Very low null rate", value: "+15", positive: true });
    base += 15;
  } else if (parseFloat(field.nullRate) > 30) {
    reasons.push({ label: "High null rate", value: "+0", positive: false });
  }

  if (field.patterns && field.patterns.length > 0) {
    reasons.push({ label: `Pattern detected (${field.patterns[0]})`, value: "+10", positive: true });
    base += 10;
  }

  if (field.description && field.description.length > 20) {
    reasons.push({ label: "AI description generated", value: "+10", positive: true });
    base += 10;
  } else {
    reasons.push({ label: "Missing description", value: "+0", positive: false });
  }

  if (field.isPrimaryKey || field.isForeignKey) {
    reasons.push({ label: field.isPrimaryKey ? "Primary key detected" : "Foreign key detected", value: "+15", positive: true });
    base += 15;
  }

  return { reasons, total: Math.min(90, base) };
}

export function ConfidenceTooltip({ field }) {
  const [visible, setVisible] = useState(false);
  const { reasons, total } = buildConfidenceBreakdown(field);

  return (
    <div className="relative inline-block">
      <span
        className="text-sm text-ds-text-muted cursor-help underline decoration-dotted decoration-ds-text-muted/40 underline-offset-2"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {field.confidence}%
      </span>

      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-ds-surface-solid border border-ds-border rounded-xl shadow-2xl p-3 pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ds-text-primary">Confidence Breakdown</span>
            <span className="text-xs font-bold text-ds-primary">{total}%</span>
          </div>
          <div className="text-xs text-ds-text-muted mb-2">Base score: 50%</div>
          <div className="space-y-1.5">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className={`text-xs ${r.positive ? "text-ds-text-muted" : "text-ds-error/70"}`}>
                  {r.positive ? "✓" : "✗"} {r.label}
                </span>
                <span className={`text-xs font-semibold ${r.positive ? "text-ds-success" : "text-ds-text-muted/50"}`}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-ds-border flex justify-between">
            <span className="text-xs text-ds-text-muted">Total (capped at 90%)</span>
            <span className="text-xs font-bold text-ds-primary">{total}%</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-ds-surface-solid border-r border-b border-ds-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}