import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@notify/types";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            projectId?: string;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies["access_token"] as string | undefined;

    if(!token) {
        res.status(401).json({ error: "Unauthorized "});
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