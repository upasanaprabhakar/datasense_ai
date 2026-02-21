import "../config.js";
import express from "express";
import Groq from "groq-sdk";
import { getSession } from "../utils/sessionStore.js";
import { getProjectById } from "../db/supabase.js";

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/chat
router.post("/", async (req, res) => {
  const { projectId, message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Build dictionary context — try session first, fall back to Supabase
  let dictionaryContext = "";
  if (projectId) {
    let fields = [];
    let fileName = "";

    // 1. Try in-memory session (set during upload)
    const session = getSession(projectId);
    if (session?.dictionary?.length > 0) {
      fields = session.dictionary;
      fileName = session.fileName;
    } else {
      // 2. Fall back to Supabase
      try {
        const project = await getProjectById(projectId);
        if (project?.fields?.length > 0) {
          fields = project.fields.map((f) => ({
            fieldName:    f.field_name,
            detectedType: f.detected_type,
            description:  f.description,
            qualityScore: f.quality_score,
          }));
          fileName = project.file_name || "Unknown";
        }
      } catch (err) {
        console.error("Chat: Supabase fallback failed:", err.message);
      }
    }

    if (fields.length > 0) {
      const fieldSummaries = fields.map((f) =>
        `- ${f.fieldName} (${f.detectedType}): ${f.description} | Quality: ${f.qualityScore}%`
      ).join("\n");

      dictionaryContext = `\n\nDATA DICTIONARY CONTEXT:
File: ${fileName}
Total Fields: ${fields.length}

Fields:
${fieldSummaries}`;
    }
  }

  const systemPrompt = `You are DataSense AI's intelligent data assistant. You help users understand their database schema, generate SQL queries, and analyze data quality.

You have access to the user's data dictionary and can:
1. Answer questions about specific fields and their meaning
2. Generate SQL queries based on the schema
3. Identify data quality issues and suggest improvements
4. Explain relationships between fields
5. Provide data modeling recommendations

When generating SQL, always wrap it in \`\`\`sql code blocks.
Keep responses concise and practical. Always reference actual field names from the dictionary when relevant.
${dictionaryContext}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "I couldn't process that request.";

    const hasSQL = responseText.includes("```sql");
    let content = responseText;
    let sqlCode = null;
    let suffix = null;

    if (hasSQL) {
      const parts = responseText.split("```sql");
      content = parts[0].trim();
      const afterSQL = parts[1]?.split("```");
      sqlCode = afterSQL?.[0]?.trim();
      suffix = afterSQL?.[1]?.trim();
    }

    res.json({
      role: "assistant",
      content,
      sqlCode: sqlCode || null,
      suffix: suffix || null,
      hasSQL,
    });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Failed to get AI response", details: err.message });
  }
});

export default router;