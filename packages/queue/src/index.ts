import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { EmailJobPayload, InAppJobPayload, WebhookJobPayload} from "@notify/types";

// ============================================================================
// Notification Queue Package
// Centralized BullMQ queue initialization, Redis client factory, and retry policies.
// ============================================================================

/**
 * Unique names for each notification channel queue.
 */
export const QUEUE_NAMES = {
    EMAIL: "email-delivery",
    WEBHOOK: "webhook-delivery",
    IN_APP: "inapp-delivery",
} as const;

/**
 * Creates an IORedis client configured for BullMQ compatibility (`maxRetriesPerRequest: null`).
 *
 * @returns Initialized IORedis connection instance
 */
export function createRedisConnection(): IORedis {
    return new IORedis( process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
    });
}

/**
 * Initializes and configures BullMQ queues with channel-specific retry and retention policies:
 * - Email: 3 attempts with 5-second fixed backoff
 * - Webhook: 5 attempts with exponential backoff (handles temporary recipient downtime)
 * - In-App: 3 attempts with 1-second fixed backoff
 *
 * @param connection - Shared IORedis client connection
 * @returns Object containing all initialized queues
 */
export function createQueues(connection: IORedis) {
    const emailQueues = new Queue<EmailJobPayload>( QUEUE_NAMES.EMAIL, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "fixed", delay: 5000},
            removeOnComplete: 100,
            removeOnFail: 500,
        },
    });

    const wehookQueues = new Queue<WebhookJobPayload>( QUEUE_NAMES.WEBHOOK, {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
    });

    const inaAppQueue = new Queue<InAppJobPayload>( QUEUE_NAMES.IN_APP, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "fixed", delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
    });

    return { emailQueues, wehookQueues, inaAppQueue };
}

export type Queues = ReturnType<typeof createQueues>;

export { Queue, Worker, QueueEvents } from "bullmq";
export type { Job } from "bullmq";
