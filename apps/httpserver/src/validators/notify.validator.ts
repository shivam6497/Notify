import { z } from "zod";

export const triggerNotificationSchema = z.object({
    eventSlug: z.string().min(1),
    subscriberId: z.string().min(1),
    payload: z.record(z.unknown()),
    idempotencyKey: z.string().min(1).max(255).optional(),
});

export type TriggerNotificationBody = z.infer<typeof triggerNotificationSchema>;

