import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@notify/types";

// ============================================================================
// Dashboard JWT Authentication Middleware
// Validates `access_token` stored in HttpOnly cookies for dashboard API calls.
// Attaches decoded `req.user` payload to the request object.
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      projectId?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using the access token cookie.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies["access_token"] as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Unauthorized " });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired Token" });
  }
}
