import type { Request, Response, NextFunction } from "express";
import type { CreateEventTypeBody } from "../validators/eventType.validator.js";
import {
  getEventTypes,
  createEventType,
  deleteEventType,
} from "../services/eventType.service.js";

export async function getEventTypesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const eventTypes = await getEventTypes(req.projectId!);
    res.json({ eventTypes });
  } catch (error) {
    next(error);
  }
}

export async function createEventTypeController(
  req: Request<{}, {}, CreateEventTypeBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const eventType = await createEventType(req.projectId!, req.body);
    res.status(201).json({ eventType });
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      res
        .status(409)
        .json({ error: "Event type with this slug already exists" });
      return;
    }
    next(error);
  }
}

export async function deleteEventTypeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteEventType(req.projectId!, req.params.slug!);
    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Event type not found" });
      return;
    }
    next(error);
  }
}

// Dashboard-route -------------------------------
export async function dashboardGetEventTypesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const eventTypes = await getEventTypes(req.params.projectId!);
    res.json({ eventTypes });
  } catch (err) {
    next(err);
  }
}

export async function dashboardCreateEventTypeController(
  req: Request<{ projectId: string }, {}, CreateEventTypeBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { assertProjectOwnership } = await import("../services/project.service.js");
    await assertProjectOwnership(req.params.projectId!, req.user!.userId);

    const eventType = await createEventType(req.params.projectId!, req.body);
    res.status(201).json({ eventType });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "SLUG_TAKEN") {
        res.status(409).json({ error: "Event type with this slug already exists" });
        return;
      }
      if (err.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
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

export async function dashboardDeleteEventTypeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { assertProjectOwnership } = await import("../services/project.service.js");
    await assertProjectOwnership(req.params.projectId!, req.user!.userId);

    await deleteEventType(req.params.projectId!, req.params.slug!);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        res.status(404).json({ error: "Not found" });
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