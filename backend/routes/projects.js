import express from "express";
import { getProjects, getProjectById, deleteProject } from "../db/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const projects = await getProjects();
    res.json({ projects });
  } catch (err) {
    console.error("getProjects error:", err.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const project = await getProjectById(req.params.projectId);
    res.json(project);
  } catch (err) {
    console.error("getProjectById error:", err.message);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.delete("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    await deleteProject(projectId);
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    console.error("deleteProject error:", err.message);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;