import { Router } from "express";
import { flexAuth } from "../middleware/flexAuth.middleware.js";
import {
  getLogsController,
  getLogController,
} from "../controllers/log.controller.js";

const router: Router = Router();

router.get("/", flexAuth, getLogsController);
router.get("/:logId", flexAuth, getLogController);

export { router as logRouter };