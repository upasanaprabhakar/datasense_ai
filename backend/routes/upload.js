import express from "express";
import multer from "multer";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { parseCSV, parseExcel, deleteFile } from "../utils/csvParser.js";
import { createSession, updateSession } from "../utils/sessionStore.js";
import { runAtlasAgent } from "../services/atlasAgent.js";
import { runSageAgent } from "../services/sageAgent.js";
import { runGuardianAgent } from "../services/guardianAgent.js";
import { saveProject, saveFields } from "../db/supabase.js";
const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `datasense_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel files are supported"));
    }
  },
});

// POST /api/upload
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const projectId = uuidv4();
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const ext = path.extname(fileName).toLowerCase();

  // Create session immediately so frontend can poll
  createSession(projectId, { fileName });

  // Return projectId right away — analysis runs in background
  res.json({
    projectId,
    fileName,
    message: "File received. Analysis starting...",
  });

  // Run full pipeline in background
  runPipeline(projectId, filePath, fileName, ext);
});


async function runPipeline(projectId, filePath, fileName, ext) {
  try {
    updateSession(projectId, { status: "parsing" });

    let fields;
    if (ext === ".csv") {
      fields = await parseCSV(filePath);
    } else {
      fields = await parseExcel(filePath);
    }

    updateSession(projectId, {
      status: "analyzing",
      totalFields: fields.length,
      rawFields: fields,
    });

    const atlasResults    = await runAtlasAgent(projectId, fields);
    const sageResults     = await runSageAgent(projectId, atlasResults, fileName);
    const guardianResults = await runGuardianAgent(projectId, sageResults);

    // ── Save to Supabase ──────────────────────────────────────
    const avgQuality = Math.round(
      guardianResults.reduce((sum, f) => sum + (f.qualityScore ?? 0), 0) / guardianResults.length
    );

    try {
      await saveProject({
        projectId,
        fileName,
        sourceType: ext === ".csv" ? "csv" : "excel",
        totalFields: guardianResults.length,
        avgQuality,
        status: "complete",
        metadata: null,
      });
      console.log("✅ Project saved to Supabase");

      await saveFields(projectId, guardianResults);
      console.log("✅ Fields saved to Supabase");
    } catch (saveErr) {
      console.error("❌ Supabase save error:", saveErr.message);
    }
    // ─────────────────────────────────────────────────────────

    updateSession(projectId, {
      status: "complete",
      dictionary: guardianResults,
    });

  } catch (err) {
    console.error("Pipeline error:", err.message);
    updateSession(projectId, {
      status: "error",
      error: err.message,
    });
  } finally {
    deleteFile(filePath);
  }
}

export default router;