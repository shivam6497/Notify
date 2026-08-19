import type { Request, Response, NextFunction } from "express";
import { prisma } from "@notify/db";
import bcrypt from "bcryptjs";

// ============================================================================
// Developer API Key Authentication Middleware
// Validates `Bearer nk_live_<prefix>_<secret>` authorization headers on /v1/* endpoints.
//
// Performance & Security Architecture:
// 1. Extracts the indexed `nk_live_<prefix>` to do an ultra-fast O(1) DB lookup.
// 2. Uses `bcrypt.compare` to verify the full raw key against the stored hash.
// 3. Asynchronously touches `lastUsedAt` without blocking the request pipeline.
// 4. Sets `req.projectId` for downstream route handlers.
// ============================================================================

/**
 * Middleware to authenticate requests using developer API keys.
 */
export async function apiKeyAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers["authorization"];

    if(!authHeader && !authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing API key" });
        return;
    }

    const rawKey = authHeader.slice(7);

    const parts = rawKey.split("_");

    // Key format: nk_live_<prefix>_<secret> (must have at least 4 segments when split by '_')
    if(parts.length < 4) {
        res.status(401).json({ error: "Invalid API key format" });
        return;
    }

    // Extract prefix: "nk_live_abc12345"
    const prefix = parts.slice(0, 3).join("_");

    // Step 1: Indexed lookup by prefix for active keys
    const apiKey = await prisma.apiKey.findFirst({
        where: {
            prefix,
            revokedAt: null,
        },
    });

    if(!apiKey) {
        res.status(401).json({ error: "Invalid API Key" });
        return;
    }

    // Step 2: Compare raw key with stored bcrypt hash
    const valid = await bcrypt.compare(rawKey , apiKey.hash);
    if(!valid) {
        res.status(401).json({ error: "Invalid API Key" });
        return;
    }

    // Step 3: Non-blocking background touch for lastUsedAt
    prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
    }).catch(console.error);

    // Step 4: Expose authenticated projectId on the Express request object
    req.projectId = apiKey.projectId;
    next();

}