import "../config.js";
import Groq from "groq-sdk";
import { updateAgentStatus, addAgentLog } from "../utils/sessionStore.js";



export async function runAtlasAgent(projectId, fields) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  updateAgentStatus(projectId, "atlas", { status: "active", progress: 5 });
  addAgentLog(projectId, "atlas", `Starting schema analysis on ${fields.length} fields`);

  const results = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const progress = Math.round(10 + (i / fields.length) * 85);

    updateAgentStatus(projectId, "atlas", { progress });
    addAgentLog(projectId, "atlas", `Scanning column: ${field.fieldName} (${field.detectedType.toUpperCase()})`);

    // Detect key relationships
    const isPrimaryKey = detectPrimaryKey(field);
    const isForeignKey = detectForeignKey(field);
    const patterns = detectPatterns(field);

    if (isPrimaryKey) addAgentLog(projectId, "atlas", `Primary key detected on: ${field.fieldName}`);
    if (isForeignKey) addAgentLog(projectId, "atlas", `Foreign key pattern detected: ${field.fieldName}`);

    addAgentLog(projectId, "atlas", `Null rate: ${field.nullRate}% | Unique rate: ${field.uniqueRate}%`);

    results.push({
      ...field,
      isPrimaryKey,
      isForeignKey,
      patterns,
      atlasAnalyzed: true,
    });

    // Small delay to simulate real processing
    await sleep(100);
  }

  updateAgentStatus(projectId, "atlas", { status: "complete", progress: 100 });
  addAgentLog(projectId, "atlas", `Schema analysis complete. ${fields.length} fields processed. Handoff → SAGE`);

  return results;
}

function detectPrimaryKey(field) {
  const name = field.fieldName.toLowerCase();
  return (
    (name === "id" || name.endsWith("_id") || name.endsWith("id")) &&
    parseFloat(field.uniqueRate) > 95 &&
    parseFloat(field.nullRate) === 0
  );
}

function detectForeignKey(field) {
  const name = field.fieldName.toLowerCase();
  return (
    name.endsWith("_id") &&
    !detectPrimaryKey(field)
  );
}

function detectPatterns(field) {
  const patterns = [];
  const samples = field.sampleValues || [];

  if (samples.some((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) patterns.push("email");
  if (samples.some((v) => /^\+?[\d\s\-()]{7,}$/.test(v))) patterns.push("phone");
  if (samples.some((v) => /^\d{4}-\d{2}-\d{2}/.test(v))) patterns.push("iso_date");
  if (samples.some((v) => /^https?:\/\//.test(v))) patterns.push("url");
  if (field.detectedType === "string" && field.uniqueCount < 20) patterns.push("categorical");

  return patterns;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}