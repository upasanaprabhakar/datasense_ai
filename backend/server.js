import "./config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import uploadRouter from "./routes/upload.js";
import analysisRouter from "./routes/analysis.js";
import dictionaryRouter from "./routes/dictionary.js";
import chatRouter from "./routes/chat.js";
import projectsRouter from "./routes/projects.js";
import connectRouter from "./routes/connect.js";
// ...


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: [
    "https://datasense-ai-xi.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/upload", uploadRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/dictionary", dictionaryRouter);
app.use("/api/chat", chatRouter);
app.use("/api/projects", projectsRouter);
// Error handler
app.use(errorHandler);
app.use("/api/connect", connectRouter);
app.listen(PORT, () => {
  console.log(`DataSense AI backend running on http://localhost:${PORT}`);
});

export default app;