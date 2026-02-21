// In-memory store for analysis sessions
// Stores progress and results per project ID
const sessions = new Map();

export function createSession(projectId, data) {
  sessions.set(projectId, {
    projectId,
    fileName: data.fileName,
    totalFields: 0,
    status: "uploading",
    agentStatus: {
      atlas: { status: "waiting", progress: 0, logs: [] },
      sage:  { status: "waiting", progress: 0, logs: [] },
      guardian: { status: "waiting", progress: 0, logs: [] },
    },
    rawFields: [],
    dictionary: [],
    createdAt: new Date().toISOString(),
  });
  return sessions.get(projectId);
}

export function getSession(projectId) {
  return sessions.get(projectId) || null;
}

export function updateSession(projectId, updates) {
  const session = sessions.get(projectId);
  if (!session) return null;
  const updated = { ...session, ...updates };
  sessions.set(projectId, updated);
  return updated;
}

export function updateAgentStatus(projectId, agent, updates) {
  const session = sessions.get(projectId);
  if (!session) return null;
  session.agentStatus[agent] = { ...session.agentStatus[agent], ...updates };
  sessions.set(projectId, session);
  return session;
}

export function addAgentLog(projectId, agent, log) {
  const session = sessions.get(projectId);
  if (!session) return null;
  session.agentStatus[agent].logs.push({
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    msg: log,
  });
  sessions.set(projectId, session);
  return session;
}

export function getAllSessions() {
  return Array.from(sessions.values()).map((s) => ({
    projectId: s.projectId,
    fileName: s.fileName,
    status: s.status,
    totalFields: s.totalFields,
    createdAt: s.createdAt,
  }));
}