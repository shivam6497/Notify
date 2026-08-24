import type { Request, Response, NextFunction } from "express";
import { getLogs, getLog } from "../services/log.service.js";
import type { Channel, DeliveryStatus } from "@notify/types";

export async function getLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cursor, limit, channel, status, eventSlug, subscriberId } =
      req.query as {
        cursor?: string;
        limit?: string;
        channel?: Channel;
        status?: DeliveryStatus;
        eventSlug?: string;
        subscriberId?: string;
      };

    const result = await getLogs({
      projectId: req.projectId!,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      channel,
      status,
      eventSlug,
      subscriberId,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "SUBSCRIBER_NOT_FOUND") {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }
    next(err);
  }
}

export async function getLogController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await getLog(req.params.logId!, req.projectId!);
    res.json({ log });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        res.status(404).json({ error: "Log not found" });
        return;
      }
      if (err.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(err);
  }
}
