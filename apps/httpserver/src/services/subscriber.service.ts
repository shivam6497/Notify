import { prisma } from "@notify/db";
import {
  CreateSubscriberBody,
  UpdatePreferenceBody,
} from "../validators/subscriber.validator.js";

// ============================================================================
// Subscriber Service
// Manages notification recipients (subscribers) and their delivery preferences.
// ============================================================================

/**
 * Creates or updates (upserts) a subscriber for a project.
 * Uses the composite unique index on (projectId, externalId).
 *
 * @param projectId - The project the subscriber belongs to
 * @param body - Subscriber details (externalId, email, webhookUrl)
 * @returns The created or updated subscriber record
 */
export async function createSubscriber(
  projectId: string,
  body: CreateSubscriberBody,
) {
  return prisma.subscriber.upsert({
    where: {
      projectId_externalId: {
        projectId,
        externalId: body.externalId,
      },
    },
    update: {
      email: body.email,
      webhookUrl: body.webhookUrl,
    },
    create: {
      projectId,
      externalId: body.externalId,
      email: body.email,
      webhookUrl: body.webhookUrl,
    },
  });
}

/**
 * Fetches a single subscriber by externalId within a project.
 *
 * @param projectId - Target project ID
 * @param externalId - External user identifier in the client application
 * @throws {Error} "NOT_FOUND" if subscriber does not exist
 * @returns The subscriber record
 */
export async function getSubscriber(projectId: string, externalId: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_externalId: {
        projectId,
        externalId,
      },
    },
  });

  if (!subscriber) throw new Error("NOT_FOUND");
  return subscriber;
}

/**
 * Lists all subscribers belonging to a project.
 *
 * @param projectId - Target project ID
 * @returns Array of subscribers ordered by creation date descending
 */
export async function getSubscribers(projectId: string) {
  return prisma.subscriber.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Deletes a subscriber and related preference records.
 *
 * @param projectId - Target project ID
 * @param externalId - External user identifier
 * @throws {Error} "NOT_FOUND" if subscriber does not exist
 * @returns The deleted subscriber record
 */
export async function deleteSubscriber(projectId: string, externalId: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_externalId: {
        projectId,
        externalId,
      },
    },
  });

  if (!subscriber) throw new Error("NOT_FOUND");

  return prisma.subscriber.delete({
    where: {
      id: subscriber.id,
    },
  });
}

/**
 * Retrieves delivery channel preferences for a subscriber.
 *
 * @param projectId - Target project ID
 * @param externalId - External user identifier
 * @throws {Error} "NOT_FOUND" if subscriber does not exist
 * @returns Array of notification preference settings
 */
export async function getPreferences(projectId: string, externalId: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_externalId: { projectId, externalId },
    },
    include: {
      notificationPreferences: true,
    },
  });

  if (!subscriber) throw new Error("NOT_FOUND");
  return subscriber.notificationPreferences;
}

/**
 * Updates or creates subscriber preferences per event-type and channel in a single transaction.
 *
 * @param projectId - Target project ID
 * @param externalId - External user identifier
 * @param body - List of preferences { eventSlug, channel, enabled }
 * @throws {Error} "NOT_FOUND" if subscriber does not exist
 * @returns Result of the Prisma transaction batch
 */
export async function updatePreferences(
  projectId: string,
  externalId: string,
  body: UpdatePreferenceBody,
) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      projectId_externalId: { projectId, externalId },
    },
  });

  if (!subscriber) throw new Error("NOT_FOUND");

  const upserts = body.preferences.map((pref) =>
    prisma.notificationPreferences.upsert({
      where: {
        subscriberId_eventSlug_channel: {
          subscriberId: subscriber.id,
          eventSlug: pref.eventSlug,
          channel: pref.channel,
        },
      },
      update: { enabled: pref.enabled },
      create: {
        subscriberId: subscriber.id,
        eventSlug: pref.eventSlug,
        channel: pref.channel,
        enabled: pref.enabled,
      },
    }),
  );

  return prisma.$transaction(upserts);
}
