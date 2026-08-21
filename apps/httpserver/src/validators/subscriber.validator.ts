import { z } from "zod";
import { Channel } from "@notify/db";

export const createSubscriberSchema = z.object({
    externalId: z.string().min(1).max(255),
    email: z.string().email().optional(),
    webhookUrl: z.string().url().optional(),
});

export const updatePreferenceSchema = z.object({
    preferences: z.array(
        z.object({
            eventSlug: z.string().min(1),
            channel: z.nativeEnum(Channel),
            enabled: z.boolean(),
        })
    ).min(1),
});

export type CreateSubscriberBody = z.infer<typeof createSubscriberSchema>;
export type UpdatePreferenceBody = z.infer<typeof updatePreferenceSchema>;