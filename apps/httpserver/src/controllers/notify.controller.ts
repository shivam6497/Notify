import { Request, Response, NextFunction } from "express";
import { triggerNotification } from "../services/notify.service";
import type { TriggerNotificationBody } from "../validators/notify.validator";
import type { Queues } from "@notify/queue";
import type IORedis from "ioredis";

export async function triggerNotificationController(
  req: Request<{}, {}, TriggerNotificationBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const queues = req.app.get("queues") as Queues;
    const redis = req.app.get("redis") as IORedis;

    const result = await triggerNotification(
      req.projectId!,
      req.body,
      queues,
      redis,
    );

    if (result.duplicate) {
      res.status(200).json({
        notificationId: result.notificationId,
        duplicate: true,
      });
    }

    res.status(202).json({
      notificationId: result.notificationId,
      duplicate: false,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "EVENT_NOT_FOUND") {
        res.status(404).json({ error: "Event type not found" });
        return;
      }
      if (err.message === "SUBSCRIBER_NOT_FOUND") {
        res.status(404).json({ error: "Subscriber not found" });
        return;
      }
    }
    next(err);
  }
}
