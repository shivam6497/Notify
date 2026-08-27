import { api } from "@/lib/axios";
import type { Channel, DeliveryStatus } from "@notify/types";

export interface DeliveryLog {
  id: string;
  channel: Channel;
  status: DeliveryStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  failureReason: string | null;
  createdAt: string;
  notification: {
    id: string;
    eventSlug: string;
    payload: Record<string, unknown>;
    createdAt: string;
    subscriber: {
      externalId: string;
      email: string | null;
    };
  };
}

export interface LogsResponse {
  items: DeliveryLog[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export async function getLogs(
  projectId: string,
  params?: {
    cursor?: string;
    limit?: number;
    channel?: Channel;
    status?: DeliveryStatus;
    eventSlug?: string;
    subscriberId?: string;
  },
): Promise<LogsResponse> {
  const res = await api.get<LogsResponse>("/v1/logs", {
    params: { projectId, ...params },
  });
  return res.data;
}
