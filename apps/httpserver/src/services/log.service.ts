import { prisma } from "@notify/db";
import type { Channel, DeliveryStatus } from "@notify/db";

// ============================================================================
// Delivery Logs Service
// Provides cursor-based pagination and filtering for notification delivery logs.
// ============================================================================

/**
 * Filter and pagination options for querying delivery logs.
 */
interface GetLogsOptions {
  projectId: string;
  cursor?: string;
  limit?: number;
  channel?: Channel;
  status?: DeliveryStatus;
  eventSlug?: string;
  subscriberId?: string;
}

/**
 * Fetches a paginated list of delivery logs with optional multi-attribute filtering.
 * Uses keyset / cursor-based pagination for high performance with large datasets.
 *
 * @param options - Filtering and pagination parameters
 * @returns An object containing the log items, the nextCursor ID, and a hasNextPage flag
 */
export async function getLogs(options: GetLogsOptions) {
  const {
    projectId,
    cursor,
    limit = 20,
    channel,
    status,
    eventSlug,
    subscriberId,
  } = options;

  // Resolve externalId to internal database subscriber UUID if provided
  let internalSubscriberId: string | undefined;
  if (subscriberId) {
    const subscriber = await prisma.subscriber.findUnique({
      where: {
        projectId_externalId: { projectId, externalId: subscriberId },
      },
      select: { id: true },
    });
    if (!subscriber) throw new Error("SUBSCRIBER_NOT_FOUND");
    internalSubscriberId = subscriber.id;
  }

  // Fetch limit + 1 records to determine if a next page exists
  const logs = await prisma.deliveryLog.findMany({
    where: {
      notification: {
        projectId,
        ...(eventSlug && { eventSlug }),
        ...(internalSubscriberId && { subscriberId: internalSubscriberId }),
      },
      ...(channel && { channel }),
      ...(status && { status }),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    include: {
      notification: {
        select: {
          id: true,
          eventSlug: true,
          payload: true,
          createdAt: true,
          subscriber: {
            select: {
              externalId: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const hasNextPage = logs.length > limit;
  const items = hasNextPage ? logs.slice(0, -1) : logs;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  return { items, nextCursor, hasNextPage };
}

/**
 * Retrieves a single delivery log by ID and ensures it belongs to the target project.
 *
 * @param logId - Delivery log ID
 * @param projectId - Expected project ID for authorization
 * @throws {Error} "NOT_FOUND" if log record does not exist
 * @throws {Error} "FORBIDDEN" if log belongs to a different project
 * @returns Full delivery log with notification and subscriber details
 */
export async function getLog(logId: string, projectId: string) {
  const log = await prisma.deliveryLog.findUnique({
    where: { id: logId },
    include: {
      notification: {
        select: {
          id: true,
          eventSlug: true,
          payload: true,
          createdAt: true,
          projectId: true,
          subscriber: {
            select: {
              externalId: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!log) throw new Error("NOT_FOUND");

  if (log.notification.projectId !== projectId) throw new Error("FORBIDDEN");

  return log;
}
