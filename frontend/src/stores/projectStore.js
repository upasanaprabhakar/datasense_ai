import { create } from "zustand";

export const useProjectStore = create((set, get) => ({
  projectId: null,
  fileName: null,
  status: null,
  totalFields: 0,
  agentStatus: {
    atlas:    { status: "waiting", progress: 0, logs: [] },
    sage:     { status: "waiting", progress: 0, logs: [] },
    guardian: { status: "waiting", progress: 0, logs: [] },
  },
  dictionary: [],
  projects: [],

  setProject: (projectId, fileName) => set({
    projectId,
    fileName,
    status: "uploading",
    totalFields: 0,
    dictionary: [],
    agentStatus: {
      atlas:    { status: "waiting", progress: 0, logs: [] },
      sage:     { status: "waiting", progress: 0, logs: [] },
      guardian: { status: "waiting", progress: 0, logs: [] },
    },
  }),

  setProjectId: (projectId) => set({ projectId }),
  setFileName:  (fileName)  => set({ fileName }),

  updateAnalysis: (data) => {
    set({
      status: data.status,
      totalFields: data.totalFields || 0,
      agentStatus: data.agentStatus,
    });
    const { projects, projectId } = get();
    const updated = projects.map((p) =>
      p.projectId === projectId
        ? { ...p, status: data.status, totalFields: data.totalFields || 0 }
        : p
    );
    set({ projects: updated });
  },

  setDictionary: (fields) => set({ dictionary: fields }),

  addProject: (project) => {
    const { projects } = get();
    const exists = projects.find((p) => p.projectId === project.projectId);
    if (!exists) {
      set({ projects: [project, ...projects] });
    }
  },

  updateProjectStatus: (projectId, updates) => {
    const { projects } = get();
    set({
      projects: projects.map((p) =>
        p.projectId === projectId ? { ...p, ...updates } : p
      ),
    });
  },

  deleteProject: (projectId) => {
    const { projects, projectId: currentProjectId } = get();
    set({ projects: projects.filter((p) => p.projectId !== projectId) });
    
    if (currentProjectId === projectId) {
      set({
        projectId: null,
        fileName: null,
        status: null,
        totalFields: 0,
        dictionary: [],
      });
    }
  },

  clearProject: () => set({
    projectId: null,
    fileName:  null,
    status:    null,
    totalFields: 0,
    dictionary: [],
  }),
}));