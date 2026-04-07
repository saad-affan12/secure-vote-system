import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());

// CORS - Allow frontend URLs (Vercel, localhost)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  // Add your Vercel frontend URL here
  // "https://your-vercel-domain.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In production, you might want to reject unknown origins
        console.warn(`CORS request from unauthorized origin: ${origin}`);
        // For now, allow it for development
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Dynamic imports AFTER dotenv
    const { default: connectDB } = await import("./config/db.js");
    const { default: authRoutes } = await import("./routes/authRoutes.js");
    const { default: adminRoutes } = await import("./routes/adminRoutes.js");
    const { default: voterRoutes } = await import("./routes/voterRoutes.js");
    const { default: voteRoutes } = await import("./routes/voteRoutes.js");

    // Connect DB FIRST
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/voter", voterRoutes);
    app.use("/api/vote", voteRoutes);

    // Root route
    app.get("/", (req, res) => {
      res.json({
        status: "Backend running",
        service: "Secure Voting System API",
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ message: "Route not found" });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error("🔥 Server Error:", err.message);
      res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();

export default app;