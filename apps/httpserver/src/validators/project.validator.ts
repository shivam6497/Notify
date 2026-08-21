import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(100),
});

export const apiKeySchema = z.object({
    name: z.string().min(1).max(100).optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
export type APIKeyBody = z.infer<typeof apiKeySchema>;