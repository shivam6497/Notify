import type {
  NotifyConfig,
  TriggerOptions,
  CreateSubscriberOptions,
  UpdatePreferencesOptions,
  CreateEventTypeOptions,
  TriggerResponse,
  Subscriber,
} from "./types.js";

export type {
  NotifyConfig,
  TriggerOptions,
  CreateSubscriberOptions,
  UpdatePreferencesOptions,
  CreateEventTypeOptions,
  TriggerResponse,
  Subscriber,
};

export class NotifySDKError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "NotifySDKError";
  }
}

export class Notify {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NotifyConfig) {
    if (!config.apiKey) {
      throw new Error("Notify SDK: apiKey is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "http://localhost:3001"; // swap for prod URL
  }

  // ─── Core request method ──────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json() as T & { error?: string };

    if (!res.ok) {
      throw new NotifySDKError(
        res.status,
        data.error ?? `Request failed with status ${res.status}`
      );
    }

    return data;
  }

  // ─── Notifications ────────────────────────────────────

  async trigger(options: TriggerOptions): Promise<TriggerResponse> {
    return this.request<TriggerResponse>("POST", "/v1/notify", options);
  }

  // ─── Subscribers ──────────────────────────────────────

  async createSubscriber(
    options: CreateSubscriberOptions
  ): Promise<{ subscriber: Subscriber }> {
    return this.request("POST", "/v1/subscribers", options);
  }

  async getSubscriber(
    externalId: string
  ): Promise<{ subscriber: Subscriber }> {
    return this.request("GET", `/v1/subscribers/${externalId}`);
  }

  async deleteSubscriber(externalId: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/v1/subscribers/${externalId}`);
  }

  async updatePreferences(
    externalId: string,
    options: UpdatePreferencesOptions
  ): Promise<{ preferences: unknown }> {
    return this.request(
      "PATCH",
      `/v1/subscribers/${externalId}/preferences`,
      options
    );
  }

  // ─── Event Types ──────────────────────────────────────

  async createEventType(
    options: CreateEventTypeOptions
  ): Promise<{ eventType: unknown }> {
    return this.request("POST", "/v1/events", options);
  }

  async getEventTypes(): Promise<{ eventTypes: unknown[] }> {
    return this.request("GET", "/v1/events");
  }

  // ─── Webhook verification ─────────────────────────────

  static verifyWebhook(
    body: string,          
    signature: string,   
    secret: string    
  ): boolean {
  
    const crypto = require("crypto") as typeof import("crypto");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const trusted = `sha256=${expected}`;

    if (trusted.length !== signature.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(trusted),
      Buffer.from(signature)
    );
  }
}