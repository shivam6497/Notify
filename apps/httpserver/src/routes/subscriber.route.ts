import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createSubscriberSchema, updatePreferenceSchema } from "../validators/subscriber.validator.js";
import { 
    createSubscriberController,
    getSubscriberController,
    deleteSubscriberController,
    getPreferencesController,
    updatePreferencesController,
    getSubscribersController
} from "../controllers/subscriber.controller.js";
import { flexAuth } from "../middleware/flexAuth.middleware.js";

const router: Router = Router();


router.get("/", flexAuth, getSubscribersController);


router.post("/", apiKeyAuth, validate(createSubscriberSchema), createSubscriberController);
router.get("/:externalId", apiKeyAuth, getSubscriberController);
router.delete("/:externalId", flexAuth, deleteSubscriberController);
router.get("/:externalId/preferences", apiKeyAuth, getPreferencesController);
router.patch("/:externalId/preferences", apiKeyAuth, validate(updatePreferenceSchema), updatePreferencesController);

export { router as subscriberRouter };
