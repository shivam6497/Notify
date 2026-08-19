// ─── Enums ────────────────────────────────────────────────

export enum Channel {
  EMAIL = "EMAIL",
  WEBHOOK = "WEBHOOK",
  IN_APP = "IN_APP",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
}

// ─── API Request / Response Types ─────────────────────────

export interface TriggerNotificationBody {
  eventSlug: string;
  subscriberId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface CreateSubscriberBody {
  externalId: string;
  email?: string;
  webhookUrl?: string;
}

export interface UpdatePreferencesBody {
  preferences: {
    eventSlug: string;
    channel: Channel;
    enabled: boolean;
  }[];
}

export interface CreateEventTypeBody {
  slug: string;
  description?: string;
  channels: Channel[];
}

// ─── BullMQ Job Payloads ──────────────────────────────────

export interface EmailJobPayload {
  notificationId: string;
  deliveryLogId: string;
  to: string;
  eventSlug: string;
  payload: Record<string, unknown>;
  projectId: string;
}

export interface WebhookJobPayload {
  notificationId: string;
  deliveryLogId: string;
  webhookUrl: string;
  eventSlug: string;
  payload: Record<string, unknown>;
  projectId: string;
}

export interface InAppJobPayload {
  notificationId: string;
  deliveryLogId: string;
  subscriberId: string;
  externalId: string;
  eventSlug: string;
  payload: Record<string, unknown>;
  projectId: string;
}

// ─── Auth ─────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
}