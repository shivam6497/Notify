export interface NotifyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface TriggerOptions {
  eventSlug: string;
  subscriberId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface CreateSubscriberOptions {
  externalId: string;
  email?: string;
  webhookUrl?: string;
}

export interface UpdatePreferencesOptions {
  preferences: {
    eventSlug: string;
    channel: "EMAIL" | "WEBHOOK" | "IN_APP";
    enabled: boolean;
  }[];
}

export interface CreateEventTypeOptions {
  slug: string;
  description?: string;
  channels: ("EMAIL" | "WEBHOOK" | "IN_APP")[];
}

export interface TriggerResponse {
  notificationId: string;
  duplicate: boolean;
}

export interface Subscriber {
  id: string;
  externalId: string;
  email: string | null;
  webhookUrl: string | null;
  createdAt: string;
}

export interface NotifyError {
  error: string;
  status: number;
}