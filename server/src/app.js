import express from "express";
import cors from "cors";
import helmet from "helmet";
import scanRouter from "./routes/scan.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// 1. Security Enhancements
app.use(helmet({
  // Allow scripts and assets to load properly in standard development environments
  contentSecurityPolicy: false,
}));
app.use(cors());

// 2. Request Parsing with Payload Size Limits (1MB) to prevent buffer overflows / DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 3. Mount core API routers
app.use("/api", scanRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);

// 4. API Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Scam Detector API engine is running cleanly.",
    timestamp: new Date().toISOString(),
  });
});

// 5. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
