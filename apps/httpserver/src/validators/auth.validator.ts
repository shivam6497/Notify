import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email(),
    password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/\d/, "Password must contain at least one number")
            .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
            .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
    name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/\d/, "Password must contain at least one number")
            .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
            .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;