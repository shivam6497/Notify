import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// ============================================================================
// ShopZap Demo Application Server
// Simulated consumer e-commerce application integrating with Notify platform.
//
// Features:
// 1. Serves the ShopZap demo single-page application.
// 2. Embedded Webhook endpoint (POST /webhook) with live HMAC-SHA256 signature verification.
// 3. Server-Sent Events (SSE) stream to push incoming webhook logs in real-time to the browser.
// 4. API proxy endpoints to communicate with Notify HTTP Server (Port 3001).
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DEMO_PORT || 4000;
const NOTIFY_API_URL = process.env.NOTIFY_API_URL || "http://localhost:3001";

// In-memory active webhook secret for live HMAC validation
let currentWebhookSecret = process.env.WEBHOOK_SECRET || "";

// In-memory webhook delivery history buffer (stores last 50 deliveries)
const webhookHistory: Array<Record<string, unknown>> = [];

// Active SSE client connections
const sseClients: Response[] = [];

// ─── Middleware ─────────────────────────────────────────────

app.use(cors());

// Parse raw text for /webhook to guarantee exact byte-by-byte HMAC-SHA256 calculation
app.use(
  "/webhook",
  express.text({ type: ["application/json", "text/plain", "*/*"] })
);

// Standard JSON parser for API proxy endpoints
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "../public")));

// ─── Server-Sent Events (SSE) Stream ────────────────────────

/**
 * SSE endpoint for streaming incoming webhook deliveries live to the browser UI.
 * Also replays recent webhook history on initial connection.
 */
app.get("/api/webhook-stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.push(res);

  // Send initial connection heartbeat & past webhook backlog
  res.write(
    `data: ${JSON.stringify({
      type: "WEBHOOK_HISTORY",
      history: webhookHistory,
    })}\n\n`
  );

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

/**
 * REST endpoint to fetch webhook delivery history backlog.
 */
app.get("/api/webhook-history", (_req: Request, res: Response) => {
  res.json({ history: webhookHistory });
});

/**
 * Clears in-memory webhook delivery history.
 */
app.delete("/api/webhook-history", (_req: Request, res: Response) => {
  webhookHistory.length = 0;
  res.json({ success: true, count: 0 });
});

/**
 * Broadcasts webhook event payload to all connected SSE clients.
 */
function broadcastWebhookEvent(eventData: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

// ─── Webhook Receiver Endpoint ──────────────────────────────

/**
 * Receives webhook callbacks dispatched from Notify background workers.
 * Verifies the `X-Notify-Signature` header using HMAC-SHA256.
 */
app.post("/webhook", (req: Request, res: Response) => {
  const signatureHeader = req.headers["x-notify-signature"] as string | undefined;
  const eventSlug = req.headers["x-notify-event"] as string | undefined;
  const projectId = req.headers["x-notify-project"] as string | undefined;
  const timestamp = req.headers["x-notify-timestamp"] as string | undefined;

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  let verified = false;
  let computedSignature = "";

  if (currentWebhookSecret && signatureHeader) {
    computedSignature = crypto
      .createHmac("sha256", currentWebhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedSignature = `sha256=${computedSignature}`;
    try {
      verified = crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch {
      verified = false;
    }
  }

  let parsedPayload: unknown = null;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    parsedPayload = rawBody;
  }

  const webhookLog = {
    type: "WEBHOOK_RECEIVED",
    timestamp: new Date().toISOString(),
    eventSlug: eventSlug || "unknown",
    projectId: projectId || "unknown",
    headers: {
      "x-notify-signature": signatureHeader,
      "x-notify-event": eventSlug,
      "x-notify-project": projectId,
      "x-notify-timestamp": timestamp,
    },
    rawBody,
    payload: parsedPayload,
    verified,
    computedSignature,
    providedSignature: signatureHeader,
  };

  // Add to in-memory history buffer (keep last 50)
  webhookHistory.unshift(webhookLog);
  if (webhookHistory.length > 50) {
    webhookHistory.pop();
  }

  console.log(
    `[Webhook] Received event "${eventSlug}" | Verified: ${verified ? "✅ YES" : "❌ NO"}`
  );

  // Push to all connected browser tabs via SSE
  broadcastWebhookEvent(webhookLog);

  res.status(200).json({
    received: true,
    verified,
    timestamp: new Date().toISOString(),
  });
});

// ─── Configuration & Proxy Endpoints ────────────────────────

/**
 * Updates the active webhook secret used for HMAC verification.
 */
app.post("/api/config/secret", (req: Request, res: Response) => {
  const { secret } = req.body as { secret?: string };
  currentWebhookSecret = (secret || "").trim();
  res.json({ success: true, secretSet: !!currentWebhookSecret });
});

/**
 * Proxy: Registers/Upserts a subscriber with Notify API.
 */
app.post("/api/proxy/subscribers", async (req: Request, res: Response) => {
  const apiKey = req.headers["authorization"];
  try {
    const response = await fetch(`${NOTIFY_API_URL}/v1/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey as string,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reach Notify API" });
  }
});

/**
 * Proxy: Triggers a notification event via Notify API.
 */
app.post("/api/proxy/notify", async (req: Request, res: Response) => {
  const apiKey = req.headers["authorization"];
  try {
    const response = await fetch(`${NOTIFY_API_URL}/v1/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey as string,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reach Notify API" });
  }
});

/**
 * Proxy: Gets subscriber preferences.
 */
app.get("/api/proxy/subscribers/:externalId/preferences", async (req: Request, res: Response) => {
  const apiKey = req.headers["authorization"];
  const { externalId } = req.params;
  try {
    const response = await fetch(`${NOTIFY_API_URL}/v1/subscribers/${externalId}/preferences`, {
      headers: {
        Authorization: apiKey as string,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch preferences" });
  }
});

/**
 * Proxy: Updates subscriber preferences.
 */
app.put("/api/proxy/subscribers/:externalId/preferences", async (req: Request, res: Response) => {
  const apiKey = req.headers["authorization"];
  const { externalId } = req.params;
  try {
    const response = await fetch(`${NOTIFY_API_URL}/v1/subscribers/${externalId}/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey as string,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update preferences" });
  }
});

// ─── Bootstrap Server ───────────────────────────────────────

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛍️  ShopZap Demo Consumer App Running on: http://localhost:${PORT}`);
  console.log(`🪝  Webhook Receiver Listening at:        http://localhost:${PORT}/webhook`);
  console.log(`📡  Connecting to Notify API at:          ${NOTIFY_API_URL}`);
  console.log(`=======================================================`);
});
