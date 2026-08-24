import { Request, Response, NextFunction } from "express";
import type {
  CreateProjectBody,
  UpdateProjectBody,
  APIKeyBody
} from "../validators/project.validator.js";
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getApiKey,
  createApiKey,
  revokeApiKey
} from "../services/project.service.js";
import { AppError } from "../middleware/errorHandler.middleware.js";

// Projects ----------------------------------------------

export async function getProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projects = await getUserProjects(req.user!.userId);
    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
}

export async function getProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await getProjectById(
      req.params.projectId!,
      req.user!.userId,
    );
    res.status(200).json({
      project,
    });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied." });
        return;
      }
    }
    next(error);
  }
}

export async function createProjectController(
  req: Request<{}, {}, CreateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await createProject(req.body, req.user!.userId);
    res.json(201).json({ project });
    return;
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(
  req: Request<{ projectId: string }, {}, UpdateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await updateProject(
      req.params.projectId,
      req.user!.userId,
      req.body,
    );
    res.status(200).json({ project });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(error);
  }
}

export async function deleteProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteProject(req.params.projectId!, req.user!.userId);
    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(error);
  }
}

// API Key----------------------------------------------

export async function getApiKeyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const keys = await getApiKey(req.params.projectId!, req.user!.userId);
    res.status(200).json({ keys });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(error);
  }
}

export async function createApiKeyController(
  req: Request<{projectId: string}, {}, APIKeyBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { key, prefix } = await createApiKey(
      req.params.projectId,
      req.user!.userId,
      req.body,
    );

    res.status(200).json({
      key,
      prefix,
      message: "Store this key securely — it will never be shown again",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(error);
  }
}

export async function revokeApiKeyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await revokeApiKey(
      req.params.keyId!,
      req.params.projectId!,
      req.user!.userId,
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Key not found" });
        return;
      }
      if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    next(error);
  }
}
