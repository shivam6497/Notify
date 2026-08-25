import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.route.js";
import { projectRouter } from "./routes/project.route.js";
import { subscriberRouter } from "./routes/subscriber.route.js";
import { notifyRouter } from "./routes/notify.route.js";
import { eventTypeRouter } from "./routes/eventType.route.js";
import { logRouter } from "./routes/log.route.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { createRedisConnection, createQueues } from "@notify/queue";
import type { Queues } from "@notify/queue";

import { prisma } from "@notify/db";

// ============================================================================
// Express HTTP Server Entrypoint
// Configures security middlewares, initializes Redis connections & BullMQ queues,
// mounts dashboard and developer API routes, and connects to PostgreSQL.
// ============================================================================

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// ─── Global Security & Parsing Middleware ─────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true, // Required for HttpOnly session cookie transmission
}));
app.use(express.json());
app.use(cookieParser());

// ─── Redis Connection & BullMQ Queues Setup ───────────────

const redis = createRedisConnection();
const queues = createQueues(redis);

redis.on("connect", () => {
  console.log("Redis connected successfully");
});
redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

// Attach Redis and Queues to Express app locals for route handlers to access
app.set("redis", redis);  
app.set("queues", queues);

// ─── Route Namespaces ─────────────────────────────────────

// Dashboard Authentication (Email/Password, OTP, and Google OAuth)
app.use("/auth", authRouter);

// Dashboard Management (JWT protected project & key management)
app.use("/projects", projectRouter);

// Public Developer API v1 (API Key protected via `x-api-key` header)
app.use("/v1/notify", notifyRouter);
app.use("/v1/subscribers", subscriberRouter);
app.use("/v1/events", eventTypeRouter);
app.use("/v1/logs", logRouter);

// ─── System Health Endpoint ───────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Global Error Handler Middleware ───────────────────────

app.use(errorHandler);

// ─── Server Bootstrap ─────────────────────────────────────

async function main() {
  // Ensure database connectivity before accepting inbound HTTP traffic
  await prisma.$connect();
  console.log("PostgreSQL connected successfully");

  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export type { Queues };