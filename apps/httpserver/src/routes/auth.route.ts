import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import {
    registerController,
    loginController,
    refreshController,
    logoutController,
    getMeController,
    googleRedirectController,
    googleCallbackController,
    verifyEmailController,
    resendOTPController
} from "../controllers/auth.controller.js";
import { ipRateLimiter } from "../middleware/ratelimiter.middleware.js";

const router: Router = Router();

router.post("/register", ipRateLimiter, validate(registerSchema), registerController);
router.post("/verify-email", verifyEmailController),
router.post("/resend-otp", resendOTPController),
router.post("/login", ipRateLimiter, validate(loginSchema), loginController);
router.get("/refresh", refreshController);
router.post("/logout", authenticate, logoutController);
router.get("/me", authenticate, getMeController);

router.get("/google", googleRedirectController);
router.get("/google/callback", googleCallbackController);

export { router as authRouter };