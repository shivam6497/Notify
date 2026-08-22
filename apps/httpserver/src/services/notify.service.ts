import { prisma } from "@notify/db";
import { Channel } from "@notify/types";
import type {
  EmailJobPayload,
  WebhookJobPayload,
  InAppJobPayload,
} from "@notify/types";
import type { Queues } from "@notify/queue";
import type IORedis from "ioredis";
import type { TriggerNotificationBody } from "../validators/notify.validator";

// ============================================================================
// Notification Trigger Service
// Core dispatch engine that validates notification events, resolves recipient
// channel preferences, logs delivery records, and enqueues background jobs.
// ============================================================================

/**
 * Triggers a notification for a subscriber across enabled delivery channels.
 *
 * Workflow:
 * 1. Checks Redis for idempotency key to prevent duplicate sends within 24 hours.
 * 2. Validates event type and subscriber existence.
 * 3. Resolves channels: checks subscriber-specific preferences; falls back to event defaults.
 * 4. Persists the Notification and pending DeliveryLogs in a database transaction.
 * 5. Pushes delivery jobs to respective BullMQ queues (Email, Webhook, In-App).
 * 6. Stores the idempotency key in Redis with a 24-hour expiration (86400s).
 *
 * @param projectId - The project initiating the notification
 * @param body - Event payload, subscriber ID, event slug, and optional idempotency key
 * @param queues - BullMQ queue instances for job processing
 * @param redis - Redis client instance for idempotency caching
 * @throws {Error} "EVENT_NOT_FOUND" if event type does not exist
 * @throws {Error} "SUBSCRIBER_NOT_FOUND" if subscriber does not exist
 * @returns Object with notificationId and duplicate flag
 */
export async function triggerNotification(
  projectId: string,
  body: TriggerNotificationBody,
  queues: Queues,
  redis: IORedis,
) {
  // Step 1: Check Idempotency Key in Redis
  if (body.idempotencyKey) {
    const key = `idempotency:${projectId}:${body.idempotencyKey}`;
    const already = await redis.get(key);

    if (already) {
      return { notificationId: already, duplicate: true };
    }
  }

  // Step 2: Validate Event Type
  const eventType = await prisma.eventType.findUnique({
    where: {
      projectId_slug: { projectId, slug: body.eventSlug },
    },
  });

  if (!eventType) throw new Error("EVENT_NOT_FOUND");

  // Step 3: Validate Subscriber & Load Channel Preferences
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_externalId: { projectId, externalId: body.subscriberId },
    },
    include: {
      notificationPreferences: {
        where: {
          eventSlug: body.eventSlug,
          enabled: true,
        },
      },
    },
  });

  if (!subscriber) throw new Error("SUBSCRIBER_NOT_FOUND");

  // Step 4: Resolve Active Channels (Subscriber preferences override event defaults)
  let enabledChannels: Channel[];

  if (subscriber.notificationPreferences.length === 0) {
    enabledChannels = eventType.channels as Channel[];
  } else {
    enabledChannels = subscriber.notificationPreferences.map(
      (p) => p.channel,
    ) as Channel[];
  }

  // If no channels are enabled, record notification without queuing delivery jobs
  if (enabledChannels.length === 0) {
    const notification = await prisma.notification.create({
      data: {
        projectId,
        subscriberId: subscriber.id,
        eventSlug: body.eventSlug,
        payload: body.payload as any,
        idempotencyKey: body.idempotencyKey,
      },
    });

    return { notificationId: notification.id, duplicate: false };
  }

  // Step 5: Atomically save Notification and PENDING DeliveryLog for each channel
  const notification = await prisma.$transaction(async (tx) => {
    const notif = await tx.notification.create({
      data: {
        projectId,
        subscriberId: subscriber.id,
        eventSlug: body.eventSlug,
        payload: body.payload as any,
        idempotencyKey: body.idempotencyKey,
      },
    });

    await tx.deliveryLog.createMany({
      data: enabledChannels.map((channel) => ({
        notificationId: notif.id,
        channel,
        status: "PENDING" as const,
      })),
    });
    return notif;
  });

  // Step 6: Dispatch asynchronous jobs to BullMQ queues
  const jobs: Promise<unknown>[] = [];

  for (const channel of enabledChannels) {
    const deliveryLog = await prisma.deliveryLog.findFirst({
      where: { notificationId: notification.id, channel },
    });

    if (!deliveryLog) continue;

    // Email Channel Job
    if (channel === Channel.EMAIL) {
      if (!subscriber.email) continue;

      const payload: EmailJobPayload = {
        notificationId: notification.id,
        deliveryLogId: deliveryLog.id,
        to: subscriber.email,
        eventSlug: body.eventSlug,
        payload: body.payload as Record<string, unknown>,
        projectId,
      };

      jobs.push(queues.emailQueues.add("send-email", payload));
    }

    // Webhook Channel Job
    if (channel === Channel.WEBHOOK) {
      if (!subscriber.webhookUrl) continue;

      const payload: WebhookJobPayload = {
        notificationId: notification.id,
        deliveryLogId: deliveryLog.id,
        webhookUrl: subscriber.webhookUrl,
        eventSlug: body.eventSlug,
        payload: body.payload as Record<string, unknown>,
        projectId,
      };

      jobs.push(queues.wehookQueues.add("send-webhook", payload));
    }

    // In-App WebSocket Channel Job
    if (channel === Channel.IN_APP) {
      const payload: InAppJobPayload = {
        notificationId: notification.id,
        deliveryLogId: deliveryLog.id,
        subscriberId: subscriber.id,
        externalId: subscriber.externalId,
        eventSlug: body.eventSlug,
        payload: body.payload as Record<string, unknown>,
        projectId,
      };

      jobs.push(queues.inaAppQueue.add("send-inapp", payload));
    }
  }

  await Promise.all(jobs);
  
  // Step 7: Cache Idempotency key for 24h in Redis
  if(body.idempotencyKey) {
    const key = `idempotency:${projectId}:${body.idempotencyKey}`;
    await redis.set(key, notification.id, "EX", 86400);
  }

  return { notificationId: notification.id, duplicate: false };
}
