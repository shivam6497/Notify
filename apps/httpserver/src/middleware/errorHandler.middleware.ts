import type { Request, Response, NextFunction } from "express";

export class AppError extends Error{
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if(err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    console.log(err);
    res.status(500).json({
        error: "Internal Server Error",
    });
}