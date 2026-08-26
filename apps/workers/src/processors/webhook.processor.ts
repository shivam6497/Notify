import { prisma } from "@notify/db";
import type { Job } from "@notify/queue";
import type { WebhookJobPayload } from "@notify/types";
import crypto from "crypto";

// ============================================================================
// Webhook Notification Processor
// Delivers HTTP POST payloads to external subscriber endpoints with cryptographic
// HMAC-SHA256 request signatures for integrity and authenticity verification.
//
// Retry Strategy:
// - 4xx Client Errors: Marked FAILED immediately (no retry, non-recoverable error)
// - 5xx Server Errors & Network Timeouts: Marked FAILED, re-thrown for BullMQ exponential backoff
// ============================================================================

/**
 * Processes a webhook delivery job.
 *
 * @param job - BullMQ job containing webhook URL, payload, and delivery log ID
 */
export async function webhookProcessor(
  job: Job<WebhookJobPayload>,
): Promise<void> {
  const { deliveryLogId, webhookUrl, eventSlug, payload, projectId } = job.data;

  // Track retry attempt status in database
  if (job.attemptsMade > 0) {
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "RETRYING",
        attemptCount: job.attemptsMade,
        lastAttemptAt: new Date(),
      },
    });
  }

  // Fetch project's signing secret
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { webhookSecret: true },
  });

  if (!project) {
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "FAILED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: "Project not found",
      },
    });
    return; 
  }

  const timestamp = new Date().toISOString();

  const body = JSON.stringify({
    event: eventSlug,
    payload,
    timestamp,
  });

  // Calculate HMAC-SHA256 signature using the project webhookSecret
  const signature = crypto
    .createHmac("sha256", project.webhookSecret!)
    .update(body)
    .digest("hex");

  let response: Response;

  try {
    // Dispatch HTTP POST request with 10-second timeout
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Notify-Event": eventSlug,
        "X-Notify-Project": projectId,
        "X-Notify-Signature": `sha256=${signature}`,
        "X-Notify-Timestamp": timestamp,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "FAILED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: errorMessage,
      },
    });

    // Re-throw to trigger BullMQ retry schedule
    throw error; 
  }

  // 4xx: Recipient endpoint client error (bad request / not found) -> Do not retry
  if (response.status >= 400 && response.status < 500) {
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "FAILED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: `HTTP ${response.status} — client error, not retrying`,
      },
    });
    return; 
  }

  // 5xx: Recipient server error -> Throw error to trigger BullMQ retry
  if (response.status >= 500) {
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "FAILED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: `HTTP ${response.status} — server error`,
      },
    });

    throw new Error(`HTTP ${response.status}`);
  }

  // Success 2xx -> Mark as DELIVERED
  await prisma.deliveryLog.update({
    where: { id: deliveryLogId },
    data: {
      status: "DELIVERED",
      attemptCount: job.attemptsMade + 1,
      lastAttemptAt: new Date(),
      failureReason: null,
    },
  });
}
