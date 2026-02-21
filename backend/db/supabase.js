import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function saveProject({ projectId, fileName, sourceType, totalFields, avgQuality, status, metadata }) {
  const { error } = await supabase.from("projects").insert({
    project_id:   projectId,
    file_name:    fileName,
    source_type:  sourceType,
    total_fields: totalFields,
    avg_quality:  avgQuality,
    status:       status,
    metadata:     metadata ?? null,
  });

  if (error) throw new Error(`saveProject failed: ${error.message}`);
}

export async function saveFields(projectId, fields) {
  const normalizeRate = (val) => {
    if (val == null) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    const normalized = num > 1 ? num : num * 100;
    return Math.min(100, Math.max(0, Math.round(normalized)));
  };

  const rows = fields.map((f) => ({
    project_id:        projectId,
    field_name:        f.fieldName,
    detected_type:     f.detectedType,
    description:       f.description       ?? null,
    business_category: f.businessCategory  ?? null,
    quality_score:     f.qualityScore       ?? null,
    confidence:        f.confidence         ?? null,
    status:            f.status             ?? "pending",
    is_primary_key:    f.isPrimaryKey       ?? false,
    is_foreign_key:    f.isForeignKey       ?? false,
    is_nullable:       f.isNullable         ?? true,
    null_rate:         normalizeRate(f.nullRate),
    unique_rate:       normalizeRate(f.uniqueRate),
    unique_count:      f.uniqueCount        ?? null,
    total_count:       f.totalCount         ?? null,
    patterns:          f.patterns           ?? null,
    sample_values:     f.sampleValues       ?? null,
    issues:            f.issues             ?? null,
  }));

  const { error } = await supabase.from("fields").insert(rows);
  if (error) throw new Error(`saveFields failed: ${error.message}`);
}

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getProjects failed: ${error.message}`);
  return data;
}

export async function getProjectById(projectId) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (projectError) throw new Error(`getProjectById failed: ${projectError.message}`);

  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("*")
    .eq("project_id", projectId)
    .order("id", { ascending: true });

  if (fieldsError) throw new Error(`getFields failed: ${fieldsError.message}`);

  return { ...project, fields };
}

export async function deleteProject(projectId) {
  const { error: fieldsError } = await supabase
    .from("fields")
    .delete()
    .eq("project_id", projectId);

  if (fieldsError) throw new Error(`deleteFields failed: ${fieldsError.message}`);

  const { error: projectError } = await supabase
    .from("projects")
    .delete()
    .eq("project_id", projectId);

  if (projectError) throw new Error(`deleteProject failed: ${projectError.message}`);
  
  return true;
}

export default supabase;