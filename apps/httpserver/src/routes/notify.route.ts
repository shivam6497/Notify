import { Router } from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { triggerNotificationSchema } from "../validators/notify.validator.js";
import { triggerNotificationController } from "../controllers/notify.controller.js";
import { projectRateLimiter } from "../middleware/ratelimiter.middleware.js";

const router: Router = Router();

router.use(apiKeyAuth);

router.post("/", projectRateLimiter,validate(triggerNotificationSchema), triggerNotificationController);

export { router as notifyRouter };