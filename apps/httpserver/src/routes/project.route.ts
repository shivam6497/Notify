import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema, apiKeySchema } from "../validators/project.validator.js";
import {
    getProjectsController,
    getProjectController,
    createProjectController,
    updateProjectController,
    deleteProjectController,
    getApiKeyController,
    createApiKeyController,
    revokeApiKeyController
} from "../controllers/project.controller.js";
import {
  dashboardGetEventTypesController,
  dashboardCreateEventTypeController,
  dashboardDeleteEventTypeController,
} from "../controllers/eventType.controller.js";
import { createEventTypeSchema } from "../validators/eventType.validator.js";

const router: Router = Router();

router.use(authenticate);

router.get("/", getProjectsController);
router.post("/", validate(createProjectSchema), createProjectController);
router.get("/:projectId", getProjectController);
router.patch("/:projectId", validate(updateProjectSchema), updateProjectController);
router.delete("/:projectId", deleteProjectController);

// API KEY managment

router.get("/:projectId/keys", getApiKeyController);
router.post("/:projectId/keys", validate(apiKeySchema), createApiKeyController);
router.delete("/:projectId/keys/:keyId", revokeApiKeyController);

// Event Types (dashboard)
router.get("/:projectId/events", dashboardGetEventTypesController);
router.post("/:projectId/events", validate(createEventTypeSchema), dashboardCreateEventTypeController);
router.delete("/:projectId/events/:slug", dashboardDeleteEventTypeController);

export { router as projectRouter };