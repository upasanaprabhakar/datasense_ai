import fs from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";

// Parse CSV file and return field analysis
export async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (rows.length < 100) rows.push(row); // sample first 100 rows
      })
      .on("end", () => {
        if (rows.length === 0) {
          return reject(new Error("CSV file is empty"));
        }
        const fields = extractFields(rows);
        resolve(fields);
      })
      .on("error", reject);
  });
}

// Parse Excel file
export async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("No worksheets found in Excel file");

  const rows = [];
  const headers = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.values.forEach((val, i) => {
        if (i > 0 && val) headers.push(String(val).trim());
      });
    } else if (rowNumber <= 101) {
      const rowObj = {};
      row.values.forEach((val, i) => {
        if (i > 0 && headers[i - 1]) {
          rowObj[headers[i - 1]] = val;
        }
      });
      rows.push(rowObj);
    }
  });

  if (rows.length === 0) throw new Error("Excel file is empty");
  return extractFields(rows);
}

// Extract field metadata from sampled rows
function extractFields(rows) {
  const headers = Object.keys(rows[0]);
  return headers.map((fieldName) => {
    const values = rows.map((r) => r[fieldName]).filter((v) => v !== undefined && v !== null && v !== "");
    const nullCount = rows.length - values.length;
    const uniqueValues = [...new Set(values)];

    return {
      fieldName: fieldName.trim(),
      detectedType: detectType(values),
      nullCount,
      nullRate: ((nullCount / rows.length) * 100).toFixed(1),
      uniqueCount: uniqueValues.length,
      uniqueRate: ((uniqueValues.length / Math.max(values.length, 1)) * 100).toFixed(1),
      sampleValues: uniqueValues.slice(0, 5).map(String),
      totalRows: rows.length,
    };
  });
}

// Detect data type from sample values
function detectType(values) {
  if (values.length === 0) return "unknown";

  const sample = values.slice(0, 20);

  // Check boolean
  const boolValues = ["true", "false", "1", "0", "yes", "no", "t", "f"];
  if (sample.every((v) => boolValues.includes(String(v).toLowerCase()))) {
    return "boolean";
  }

  // Check integer
  if (sample.every((v) => /^-?\d+$/.test(String(v).trim()))) {
    return "integer";
  }

  // Check decimal
  if (sample.every((v) => /^-?\d+\.?\d*$/.test(String(v).trim()))) {
    return "decimal";
  }

  // Check datetime
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/,
    /^\d{4}\/\d{2}\/\d{2}/,
  ];
  if (sample.some((v) => datePatterns.some((p) => p.test(String(v))))) {
    return "datetime";
  }

  // Check email
  if (sample.some((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) {
    return "email";
  }

  return "string";
}

// Clean up uploaded file
export function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error("Failed to delete file:", e.message);
  }
}