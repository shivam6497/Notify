import { createRedisConnection, createQueues, Worker } from "@notify/queue";
import { QUEUE_NAMES } from "@notify/queue";
import { emailProcessor } from "./processors/email.processor.js";
import { webhookProcessor } from "./processors/webhook.processor.js";
import { inAppProcessor } from "./processors/inApp.processor.js";

// ============================================================================
// Background Worker Service
// Consumes and processes notification delivery jobs from Redis BullMQ queues.
// Concurrency is tuned per channel based on I/O profile and external rate limits.
// ============================================================================

const connection = createRedisConnection();
const queues = createQueues(connection);

// ─── Worker Instances & Concurrency Tuning ─────────────────

// Email Worker (Concurrency 10: limited by Resend API rate limits)
const emailWorker = new Worker(QUEUE_NAMES.EMAIL, emailProcessor, {
  connection,
  concurrency: 10,
  drainDelay: 300000,
});

// Webhook Worker (Concurrency 20: HTTP POST requests with exponential backoff)
const webhookWorker = new Worker(QUEUE_NAMES.WEBHOOK, webhookProcessor, {
  connection,
  concurrency: 20,
  drainDelay: 300000,
});

// In-App Worker (Concurrency 50: lightweight Redis Pub/Sub writes)
const inAppWorker = new Worker(QUEUE_NAMES.IN_APP, inAppProcessor, {
  connection,
  concurrency: 50,
  drainDelay: 300000,
});

// ─── Lifecycle & Error Event Listeners ──────────────────────

const workers = [emailWorker, webhookWorker, inAppWorker];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`[${worker.name}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[${worker.name}] worker error:`, err);
  });
}

console.log("Workers running — email, webhook, inapp");

// ─── Graceful Shutdown ────────────────────────────────────

async function shutdown() {
  console.log("Shutting down workers...");
  // Wait for all active in-flight jobs to complete before exiting
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
