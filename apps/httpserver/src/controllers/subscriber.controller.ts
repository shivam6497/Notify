import type { Request, Response, NextFunction } from "express";
import type {
  CreateSubscriberBody,
  UpdatePreferenceBody,
} from "../validators/subscriber.validator.js";
import {
  createSubscriber,
  getSubscriber,
  deleteSubscriber,
  getSubscribers,
  getPreferences,
  updatePreferences,
} from "../services/subscriber.service.js";

export async function createSubscriberController(
  req: Request<{}, {}, CreateSubscriberBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subscriber = await createSubscriber(req.projectId!, req.body);
    res.status(201).json({ subscriber });
  } catch (error) {
    next(error);
  }
}

export async function getSubscriberController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subscriber = await getSubscriber(
      req.projectId!,
      req.params.externalId!,
    );
    res.status(200).json({ subscriber });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }
    next(error);
  }
}

export async function getSubscribersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscribers = await getSubscribers(req.projectId!);
    res.json({ subscribers });
  } catch (err) {
    next(err);
  }
}

export async function deleteSubscriberController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteSubscriber(req.projectId!, req.params.externalId!);
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }
    next(error);
  }
}

export async function getPreferencesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const preferences = await getPreferences(
      req.projectId!,
      req.params.externalId!,
    );
    res.status(201).json({ preferences });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }
    next(error);
  }
}

export async function updatePreferencesController(
  req: Request<{ externalId: string }, {}, UpdatePreferenceBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const preferences = await updatePreferences(
      req.projectId!,
      req.params.externalId!,
      req.body,
    );
    res.status(201).json({ preferences });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }
    next(error);
  }
}
