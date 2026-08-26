import { prisma } from "@notify/db";
import type { Job } from "@notify/queue";
import { createRedisConnection } from "@notify/queue";
import type { InAppJobPayload } from "@notify/types";
import { json } from "stream/consumers";

// ============================================================================
// In-App Notification Processor
// Stores notification payloads into a capped Redis list for offline backlog retrieval
// and publishes live notification events via Redis Pub/Sub to the WebSocket cluster.
// ============================================================================

const redis = createRedisConnection();

/** Maximum unread notification backlog items retained per subscriber */
const IN_APP_MAX_STORED = 50;

/**
 * Processes an in-app notification job.
 *
 * @param job - BullMQ job containing subscriber externalId, payload, and delivery log ID
 */
export async function inAppProcessor(job: Job<InAppJobPayload>): Promise<void> {
    const { deliveryLogId, subscriberId, externalId, eventSlug, payload, projectId, notificationId } = job.data;

    try {
        const notification = {
            notificationId,
            eventSlug,
            payload,
            createdAt: new Date().toISOString(),
        };

        const redisKey = `inapp:${projectId}:${externalId}`;
        
        // 1. Store in Redis list (capped at 50 items) for offline retrieval
        await redis.lpush(redisKey, JSON.stringify(notification));
        await redis.ltrim(redisKey, 0, IN_APP_MAX_STORED - 1);

        // 2. Publish to Redis Pub/Sub channel for live connected WebSockets
        await redis.publish(
            `inApp:${projectId}:${externalId}`,
            JSON.stringify(notification)
        );

        // 3. Mark delivery log as DELIVERED
        await prisma.deliveryLog.update({
            where: { id: deliveryLogId },
            data: {
                status: "DELIVERED",
                attemptCount: job.attemptsMade + 1,
                lastAttemptAt: new Date(),
                failureReason: null,
            },
        });
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown Error";

        await prisma.deliveryLog.update({
            where: { id: deliveryLogId },
            data: {
                status: "FAILED",
                attemptCount: job.attemptsMade + 1,
                lastAttemptAt: new Date(),
                failureReason: errorMessage,
            },
        });

        throw error;
    }
}