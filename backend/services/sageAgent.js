import "../config.js";
import Groq from "groq-sdk";
import { updateAgentStatus, addAgentLog } from "../utils/sessionStore.js";

export async function runSageAgent(projectId, atlasResults, fileName) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  updateAgentStatus(projectId, "sage", { status: "active", progress: 5 });
  addAgentLog(projectId, "sage", `Received ${atlasResults.length} fields from Atlas`);
  addAgentLog(projectId, "sage", `Initializing Llama 3.3 for business context generation`);

  const results = [...atlasResults];

  for (let i = 0; i < atlasResults.length; i++) {
    const field = atlasResults[i];
    const progress = Math.round(10 + (i / atlasResults.length) * 85);
    updateAgentStatus(projectId, "sage", { progress });
    addAgentLog(projectId, "sage", `Generating description for: ${field.fieldName}`);

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a data documentation expert. Generate a concise 1-sentence business description for a database field.
Respond with ONLY a valid JSON object, no markdown, no explanation:
{"description": "one sentence business description", "businessCategory": "one of: identifier, contact, financial, temporal, status, demographic, behavioral, other"}`
          },
          {
            role: "user",
            content: `Field name: ${field.fieldName}
Data type: ${field.detectedType}
Sample values: ${field.sampleValues?.slice(0, 3).join(", ") || "none"}
From file: ${fileName}
Is primary key: ${field.isPrimaryKey}
Patterns detected: ${field.patterns?.join(", ") || "none"}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      results[i].description = parsed.description;
      results[i].businessCategory = parsed.businessCategory || "other";
      addAgentLog(projectId, "sage", `✓ ${field.fieldName}: ${parsed.description.substring(0, 60)}...`);

    } catch (err) {
      results[i].description = generateFallbackDescription(field);
      results[i].businessCategory = "other";
      addAgentLog(projectId, "sage", `⚠ Fallback description for: ${field.fieldName}`);
    }

    // Small delay to avoid rate limits
    await sleep(300);
  }

  updateAgentStatus(projectId, "sage", { status: "complete", progress: 100 });
  addAgentLog(projectId, "sage", `Business context complete. ${atlasResults.length} fields described. Handoff → GUARDIAN`);

  return results;
}

function generateFallbackDescription(field) {
  const name = field.fieldName.replace(/_/g, " ");
  if (field.isPrimaryKey) return `Unique identifier for each record in this dataset.`;
  if (field.isForeignKey) return `Reference key linking to a related entity.`;
  if (field.detectedType === "datetime") return `Timestamp recording when the ${name} event occurred.`;
  if (field.detectedType === "boolean") return `Boolean flag indicating the ${name} state.`;
  if (field.detectedType === "decimal" || field.detectedType === "integer") return `Numerical value representing the ${name}.`;
  if (field.patterns?.includes("email")) return `Email address field used for contact or identification.`;
  if (field.patterns?.includes("phone")) return `Phone number used for contact or verification.`;
  if (field.patterns?.includes("categorical")) return `Categorical field representing ${name} classification.`;
  return `Field containing ${name} information.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}