import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../utils/sessionStore.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/analysis/:projectId
// Returns current agent progress for polling
router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;

  // First try in-memory session (works right after upload on same server instance)
  const session = getSession(projectId);
  if (session) {
    return res.json({
      projectId: session.projectId,
      fileName: session.fileName,
      status: session.status,
      totalFields: session.totalFields,
      agentStatus: session.agentStatus,
    });
  }

  // Fall back to Supabase (works after redeploy or on fresh server)
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, file_name, status, total_fields")
      .eq("project_id", projectId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Return a normalized response that matches what the frontend expects
    return res.json({
      projectId: data.project_id,
      fileName: data.file_name,
      status: data.status,
      totalFields: data.total_fields,
      // No live agent logs available from DB, return completed state
      agentStatus: {
        atlas:    { status: data.status === "complete" ? "complete" : "pending", logs: [] },
        sage:     { status: data.status === "complete" ? "complete" : "pending", logs: [] },
        guardian: { status: data.status === "complete" ? "complete" : "pending", logs: [] },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/:projectId/logs
// Returns only terminal logs for all agents
router.get("/:projectId/logs", async (req, res) => {
  const { projectId } = req.params;

  // Try in-memory first
  const session = getSession(projectId);
  if (session) {
    const allLogs = [];
    ["atlas", "sage", "guardian"].forEach((agent) => {
      const agentLogs = session.agentStatus[agent]?.logs || [];
      agentLogs.forEach((log) => {
        allLogs.push({
          agent: agent.toUpperCase(),
          time: log.time,
          msg: log.msg,
        });
      });
    });
    return res.json({ logs: allLogs });
  }

  // Fall back — no logs stored in DB, return empty
  return res.json({ logs: [] });
});

export default router;