import express from "express";
import { getSession, updateSession } from "../utils/sessionStore.js";
import { getProjectById } from "../db/supabase.js";

const router = express.Router();

// Maps Supabase snake_case fields back to camelCase for frontend
function mapSupabaseField(f) {
  return {
    fieldName:        f.field_name,
    detectedType:     f.detected_type,
    description:      f.description,
    businessCategory: f.business_category,
    qualityScore:     f.quality_score,
    confidence:       f.confidence,
    status:           f.status,
    isPrimaryKey:     f.is_primary_key,
    isForeignKey:     f.is_foreign_key,
    isNullable:       f.is_nullable,
    nullRate:         f.null_rate,
    uniqueRate:       f.unique_rate,
    uniqueCount:      f.unique_count,
    totalRows:        f.total_count,
    patterns:         f.patterns,
    sampleValues:     f.sample_values,
    issues:           f.issues,
    hasPII:           f.has_pii,
    piiType:          f.pii_type,
    piiDescription:   f.pii_description,
    piiRiskLevel:     f.pii_risk_level,
    gdprCategory:     f.gdpr_category,
    piiConfidence:    f.pii_confidence,
    guardianAnalyzed: true,
  };
}

// GET /api/dictionary/:projectId
router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;

  // First try in-memory session
  const session = getSession(projectId);

  if (session && session.status === "complete" && session.dictionary?.length > 0) {
    const avgQuality = Math.round(
      session.dictionary.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / session.dictionary.length
    );
    return res.json({
      projectId,
      fileName:    session.fileName,
      totalFields: session.totalFields,
      avgQuality,
      approved: session.dictionary.filter(f => f.status === "approved").length,
      pending:  session.dictionary.filter(f => f.status === "pending").length,
      rejected: session.dictionary.filter(f => f.status === "rejected").length,
      fields:   session.dictionary,
    });
  }

  if (session && session.status !== "complete") {
    return res.status(202).json({
      message: "Analysis still in progress",
      status: session.status,
    });
  }

  // Fallback to Supabase if not in memory
  try {
    const project = await getProjectById(projectId);
    if (!project || !project.fields?.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const fields = project.fields.map(mapSupabaseField);
    const avgQuality = Math.round(
      fields.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / fields.length
    );

    return res.json({
      projectId,
      fileName:    project.file_name,
      totalFields: project.total_fields,
      avgQuality,
      approved: fields.filter(f => f.status === "approved").length,
      pending:  fields.filter(f => f.status === "pending").length,
      rejected: fields.filter(f => f.status === "rejected").length,
      fields,
    });
  } catch (err) {
    console.error("Supabase fallback error:", err.message);
    return res.status(404).json({ error: "Project not found" });
  }
});

// PATCH /api/dictionary/:projectId/field/:fieldName
router.patch("/:projectId/field/:fieldName", async (req, res) => {
  const { projectId, fieldName } = req.params;
  const { status, description } = req.body;

  // Try in-memory first
  const session = getSession(projectId);
  if (session) {
    const fieldIdx = session.dictionary.findIndex(f => f.fieldName === fieldName);
    if (fieldIdx !== -1) {
      if (status) session.dictionary[fieldIdx].status = status;
      if (description) session.dictionary[fieldIdx].description = description;
      updateSession(projectId, { dictionary: session.dictionary });
      return res.json({ success: true, field: session.dictionary[fieldIdx] });
    }
  }

  // Fallback — update directly in Supabase
  try {
    const { default: supabase } = await import("../db/supabase.js");
    const updates = {};
    if (status) updates.status = status;
    if (description) updates.description = description;

    const { error } = await supabase
      .from("fields")
      .update(updates)
      .eq("project_id", projectId)
      .eq("field_name", fieldName);

    if (error) throw new Error(error.message);
    return res.json({ success: true });
  } catch (err) {
    console.error("Supabase update error:", err.message);
    return res.status(500).json({ error: "Failed to update field" });
  }
});

export default router;