import express from "express";
import { getSession } from "../utils/sessionStore.js";

const router = express.Router();

// GET /api/analysis/:projectId
// Returns current agent progress for polling
router.get("/:projectId", (req, res) => {
  const { projectId } = req.params;
  const session = getSession(projectId);

  if (!session) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json({
    projectId: session.projectId,
    fileName: session.fileName,
    status: session.status,
    totalFields: session.totalFields,
    agentStatus: session.agentStatus,
  });
});

// GET /api/analysis/:projectId/logs
// Returns only terminal logs for all agents
router.get("/:projectId/logs", (req, res) => {
  const { projectId } = req.params;
  const session = getSession(projectId);

  if (!session) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Combine all agent logs with agent prefix
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

  res.json({ logs: allLogs });
});

export default router;