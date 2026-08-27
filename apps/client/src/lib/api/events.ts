import { api } from "@/lib/axios";
import type { Channel } from "@notify/types";

export interface EventType {
  id: string;
  slug: string;
  description: string | null;
  channels: Channel[];
  createdAt: string;
}

export async function getEventTypes(projectId: string): Promise<EventType[]> {
  const res = await api.get<{ eventTypes: EventType[] }>(
    `/projects/${projectId}/events`,
  );
  return res.data.eventTypes;
}

export async function createEventType(
  projectId: string,
  data: { slug: string; description?: string; channels: Channel[] },
): Promise<EventType> {
  const res = await api.post<{ eventType: EventType }>(
    `/projects/${projectId}/events`,
    data,
  );
  return res.data.eventType;
}

export async function deleteEventType(
  projectId: string,
  slug: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/events/${slug}`);
}
