import { z } from "zod";
import { Channel } from "@notify/db";

export const createEventTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/, "Slug must be like order.placed"),
  description: z.string().max(500).optional(),
  channels: z.array(z.nativeEnum(Channel)).min(1),
});

export type CreateEventTypeBody = z.infer<typeof createEventTypeSchema>;
