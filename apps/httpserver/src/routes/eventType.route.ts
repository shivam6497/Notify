import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createEventTypeSchema } from "../validators/eventType.validator";
import {
    getEventTypesController,
    createEventTypeController,
    deleteEventTypeController
} from "../controllers/eventType.controller.js";

const router: Router = Router();

router.use(apiKeyAuth);

router.get("/", getEventTypesController);
router.post("/", validate(createEventTypeSchema), createEventTypeController);
router.delete("/:slug", deleteEventTypeController);

export { router as eventTypeRouter };