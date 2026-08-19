import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@notify/db";
import bcrypt from "bcryptjs";
import type { JwtPayload } from "@notify/types";

// accepts either JWT cookie (dashboard) or API key (developer)
export async function flexAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ─── Try JWT first (dashboard user) ──────────────────
  const token = req.cookies["access_token"] as string | undefined;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      req.user = payload;

      const projectId = req.query.projectId as string | undefined;
      if (!projectId) {
        res.status(400).json({ error: "projectId query param required" });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      if (!project || project.userId !== payload.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      req.projectId = projectId;
      next();
      return;
    } catch {

    }
  }

  // ─── Try API key (developer) ──────────────────────────
  const authHeader = req.headers["authorization"];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const rawKey = authHeader.slice(7);
    const parts = rawKey.split("_");

    if (parts.length < 4) {
      res.status(401).json({ error: "Invalid API key format" });
      return;
    }

    const prefix = parts.slice(0, 3).join("_");

    const apiKey = await prisma.apiKey.findFirst({
      where: { prefix, revokedAt: null },
    });

    if (!apiKey) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    const valid = await bcrypt.compare(rawKey, apiKey.hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    req.projectId = apiKey.projectId;
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}