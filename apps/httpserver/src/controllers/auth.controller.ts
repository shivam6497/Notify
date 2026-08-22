import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { prisma } from "@notify/db";
import type { JwtPayload } from "@notify/types";
import type { RegisterBody, LoginBody } from "../validators/auth.validator.js";
import {
  registerUser,
  loginUser,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  storeRefreshToken,
  validateRefreshToken,
  deleteRefreshToken,
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  findOrCreateGoogleUser,
  verifyOtp,
  resendOTP,
  generateOTP,
  sendVerificationEmail,
} from "../services/auth.service.js";

// Cookie Helper --------------------------------

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: getRefreshTokenExpiry(),
    path: "/auth/refresh",
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/auth/refresh" });
}

// Register ------------------------------------------

export async function registerController(
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await registerUser(req.body);
    const redis = req.app.get("redis") as import("ioredis").Redis;

    const otp = await generateOTP(user.id , redis);
    await sendVerificationEmail(user.email, otp);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        message: "Check your email for a verification code",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      res.status(409).json({
        error: "Email already in use",
      });
      return;
    }
    next(error);
  }
}

// Login ------------------------------------------------

export async function loginController(
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await loginUser(req.body);

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const redis = req.app.get("redis") as import("ioredis").Redis;
    await storeRefreshToken(user.id, refreshToken, redis);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        error: "Invalid Credentials",
      });
      return;
    }
    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
      res.status(403).json({
        error: "Please verify your email before logging in",
      });
      return;
    }
    next(error);
  }
}

// Refresh -------------------------------------------------------

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies["refresh_token"] as string | undefined;

    if (!token) {
      res.status(401).json({ error: "No Refresh Token Provided" });
      return;
    }

    const payload = jwt.verify(
      token,
      process.env.REFRESH_JWT_SECRET!,
    ) as JwtPayload;

    const redis = req.app.get("redis") as import("ioredis").Redis;
    const valid = await validateRefreshToken(payload.userId, token, redis);

    if (!valid) {
      res.status(401).json({
        error: "Invalid Refresh Token",
      });
      return;
    }

    const newPayload: JwtPayload = {
      userId: payload.userId,
      email: payload.email,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await storeRefreshToken(payload.userId, newRefreshToken, redis);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ ok: true });
  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired Refresh Token",
    });
  }
}

// ─── Logout ───────────────────────────────────────────────

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const redis = req.app.get("redis") as import("ioredis").Redis;
    await deleteRefreshToken(req.user!.userId, redis);
    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// getMe -----------------------------------------------

export async function getMeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, email: true, name: true, picture: true },
    });

    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, otp } = req.body as { userId: string; otp: string };

    if (!userId || !otp) {
      res.status(400).json({ error: "userId and otp are required" });
      return;
    }

    const redis = req.app.get("redis") as import("ioredis").Redis;
    const valid = await verifyOtp(userId, otp, redis);

    if (!valid) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeRefreshToken(user.id, refreshToken, redis);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendOTPController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, email } = req.body as { userId: string; email: string };

    if (!userId || !email) {
      res.status(400).json({ error: "userId and email are required" });
      return;
    }

    const redis = req.app.get("redis") as import("ioredis").Redis;
    await resendOTP(userId, email, redis);

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "RESEND_TOO_SOON") {
      res.status(429).json({
        error: "Please wait before requesting another code",
      });
      return;
    }
    next(err);
  }
}

// ─── Google OAuth ─────────────────────────────────────────

export function googleRedirectController(req: Request, res: Response): void {
  const state = nanoid(16);

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const url = buildGoogleAuthUrl(state);
  res.redirect(url);
}

export async function googleCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const storedState = req.cookies["oauth_state"] as string | undefined;

    if (!storedState || storedState !== state) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    res.clearCookie("oauth_state");

    const profile = await exchangeGoogleCode(code);
    const user = await findOrCreateGoogleUser(profile);

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const redis = req.app.get("redis") as import("ioredis").Redis;
    await storeRefreshToken(user.id, refreshToken, redis);

    setAuthCookies(res, accessToken, refreshToken);

    res.redirect(process.env.CLIENT_URL + "/dashboard");
  } catch (err) {
    next(err);
  }
}
