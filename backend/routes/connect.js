import "../config.js";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { createSession, updateSession } from "../utils/sessionStore.js";
import { runAtlasAgent } from "../services/atlasAgent.js";
import { runSageAgent } from "../services/sageAgent.js";
import { runGuardianAgent } from "../services/guardianAgent.js";
import { saveProject, saveFields } from "../db/supabase.js";

const router = express.Router();

const BIKESTORES_SCHEMA = {
  categories:  ["category_id", "category_name"],
  brands:      ["brand_id", "brand_name"],
  stores:      ["store_id", "store_name", "phone", "email", "street", "city", "state", "zip_code"],
  staffs:      ["staff_id", "first_name", "last_name", "email", "phone", "active", "store_id", "manager_id"],
  customers:   ["customer_id", "first_name", "last_name", "phone", "email", "street", "city", "state", "zip_code"],
  products:    ["product_id", "product_name", "brand_id", "category_id", "model_year", "list_price"],
  orders:      ["order_id", "customer_id", "order_status", "order_date", "required_date", "shipped_date", "store_id", "staff_id"],
  order_items: ["order_id", "item_id", "product_id", "quantity", "list_price", "discount"],
  stocks:      ["store_id", "product_id", "quantity"],
};

function getSupabaseClient(connectionString) {
  if (connectionString === "default" || connectionString === "demo") {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  if (connectionString.includes("|")) {
    const [url, key] = connectionString.split("|");
    return createClient(url.trim(), key.trim());
  }
  return createClient(connectionString.trim(), process.env.SUPABASE_ANON_KEY);
}

// POST /api/connect/test
router.post("/test", async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString?.trim()) {
    return res.status(400).json({ error: "Connection string is required" });
  }

  try {
    const supabase = getSupabaseClient(connectionString);
    const availableTables = [];

    for (const [tableName, columns] of Object.entries(BIKESTORES_SCHEMA)) {
      const { error } = await supabase.from(tableName).select(columns[0]).limit(1);
      if (!error) {
        availableTables.push({ name: tableName, columnCount: columns.length });
      }
    }

    if (availableTables.length === 0) {
      return res.status(400).json({ success: false, error: "No accessible tables found. Check your credentials." });
    }

    res.json({ success: true, tables: availableTables });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/connect/introspect — single table
router.post("/introspect", async (req, res) => {
  const { connectionString, tableName } = req.body;
  if (!connectionString?.trim() || !tableName?.trim()) {
    return res.status(400).json({ error: "Connection string and table name are required" });
  }

  try {
    const fields = await introspectTable(getSupabaseClient(connectionString), tableName);
    res.json({ success: true, tableName, fields });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/connect/analyze — single table through pipeline
router.post("/analyze", async (req, res) => {
  const { tableName, fields } = req.body;
  if (!tableName || !fields?.length) {
    return res.status(400).json({ error: "tableName and fields are required" });
  }

  const projectId = uuidv4();
  const fileName = `${tableName} (PostgreSQL)`;
  createSession(projectId, { fileName });
  res.json({ projectId, fileName, message: "Analysis starting..." });

  runTablePipeline(projectId, fileName, tableName, fields);
});

// POST /api/connect/analyze-all — ALL tables as one project
router.post("/analyze-all", async (req, res) => {
  const { connectionString, tables } = req.body;
  if (!connectionString || !tables?.length) {
    return res.status(400).json({ error: "connectionString and tables are required" });
  }

  const projectId = uuidv4();
  const fileName = `BikeStores Database (${tables.length} tables)`;
  createSession(projectId, { fileName });
  res.json({ projectId, fileName, message: "Full database analysis starting..." });

  // Run in background
  (async () => {
    try {
      const supabase = getSupabaseClient(connectionString);
      let allFields = [];

      updateSession(projectId, { status: "analyzing" });

      // Introspect all tables and prefix field names with table name
      for (const tableName of tables) {
        try {
          addLog(projectId, `Introspecting table: ${tableName}`);
          const fields = await introspectTable(supabase, tableName);
          // Prefix fieldName with table name so they're unique
          const prefixed = fields.map((f) => ({
            ...f,
            fieldName: `${tableName}.${f.fieldName}`,
            tableName,
          }));
          allFields = [...allFields, ...prefixed];
        } catch (err) {
          addLog(projectId, `⚠ Skipping ${tableName}: ${err.message}`);
        }
      }

      updateSession(projectId, { totalFields: allFields.length });
      addLog(projectId, `Total fields collected: ${allFields.length} across ${tables.length} tables`);

      // Run through pipeline
      const atlasResults    = await runAtlasAgent(projectId, allFields);
      const sageResults     = await runSageAgent(projectId, atlasResults, fileName);
      const guardianResults = await runGuardianAgent(projectId, sageResults);

      const avgQuality = Math.round(
        guardianResults.reduce((sum, f) => sum + (f.qualityScore ?? 0), 0) / guardianResults.length
      );

      await saveProject({
        projectId,
        fileName,
        sourceType: "postgresql",
        totalFields: guardianResults.length,
        avgQuality,
        status: "complete",
        metadata: { tables },
      });
      await saveFields(projectId, guardianResults);
      console.log(`✅ Full database analyzed: ${guardianResults.length} fields across ${tables.length} tables`);

      updateSession(projectId, { status: "complete", dictionary: guardianResults });
    } catch (err) {
      console.error("analyze-all error:", err.message);
      updateSession(projectId, { status: "error", error: err.message });
    }
  })();
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function introspectTable(supabase, tableName) {
  const { data: rows, error } = await supabase.from(tableName).select("*").limit(100);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) throw new Error(`No data in table "${tableName}"`);

  const totalRows = rows.length;
  const columnNames = Object.keys(rows[0]);

  return columnNames.map((colName) => {
    const values = rows.map((r) => r[colName]).filter((v) => v !== null && v !== undefined && v !== "");
    const nullCount = totalRows - values.length;
    const uniqueValues = [...new Set(values.map(String))];
    const isPrimaryKey = (colName === `${tableName.replace(/s$/, "")}_id` || colName === "id") && uniqueValues.length === values.length;
    const isForeignKey = colName.endsWith("_id") && !isPrimaryKey;

    return {
      fieldName:    colName,
      detectedType: detectTypeFromValues(values),
      isPrimaryKey,
      isForeignKey,
      isNullable:   nullCount > 0,
      nullCount,
      nullRate:     ((nullCount / Math.max(totalRows, 1)) * 100).toFixed(1),
      uniqueCount:  uniqueValues.length,
      uniqueRate:   ((uniqueValues.length / Math.max(values.length, 1)) * 100).toFixed(1),
      sampleValues: uniqueValues.slice(0, 5),
      totalRows,
      patterns:     [],
    };
  });
}

async function runTablePipeline(projectId, fileName, tableName, fields) {
  try {
    updateSession(projectId, { status: "analyzing", totalFields: fields.length });
    const atlasResults    = await runAtlasAgent(projectId, fields);
    const sageResults     = await runSageAgent(projectId, atlasResults, fileName);
    const guardianResults = await runGuardianAgent(projectId, sageResults);
    const avgQuality = Math.round(
      guardianResults.reduce((sum, f) => sum + (f.qualityScore ?? 0), 0) / guardianResults.length
    );
    await saveProject({ projectId, fileName, sourceType: "postgresql", totalFields: guardianResults.length, avgQuality, status: "complete", metadata: { tableName } });
    await saveFields(projectId, guardianResults);
    updateSession(projectId, { status: "complete", dictionary: guardianResults });
  } catch (err) {
    console.error("Pipeline error:", err.message);
    updateSession(projectId, { status: "error", error: err.message });
  }
}

function addLog(projectId, message) {
  try {
    const { addAgentLog } = require("../utils/sessionStore.js");
    addAgentLog(projectId, "atlas", message);
  } catch {}
}

function detectTypeFromValues(values) {
  if (values.length === 0) return "unknown";
  const sample = values.slice(0, 20);
  if (sample.every((v) => /^-?\d+$/.test(String(v)))) return "integer";
  if (sample.every((v) => /^-?\d+\.?\d*$/.test(String(v)))) return "decimal";
  if (sample.every((v) => ["true","false","1","0"].includes(String(v).toLowerCase()))) return "boolean";
  if (sample.some((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) return "datetime";
  if (sample.some((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) return "email";
  return "string";
}

export default router;