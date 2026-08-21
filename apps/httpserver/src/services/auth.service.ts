import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@notify/db";
import type { JwtPayload } from "@notify/types";
import type { RegisterBody, LoginBody } from "../validators/auth.validator.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Resend } from "resend";

// ============================================================================
// Authentication & Session Service
// Handles JWT issuance/refresh, email/password registration, OTP verification via Resend,
// and Google OAuth 2.0 PKCE / OIDC token exchange.
// ============================================================================

const resend = new Resend(process.env.RESEND_API_KEY!);

/** OTP expiration duration: 10 minutes */
const OTP_TTL = 10 * 60;

/** Token Lifetimes */
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Token Helpers
// ============================================================================

/**
 * Generates a short-lived access JWT (15m) for API authorization.
 *
 * @param paylaod - User identity payload (userId, email)
 * @returns Signed JWT string
 */
export function generateAccessToken(paylaod: JwtPayload): string {
    return jwt.sign(paylaod, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY, });
}

/**
 * Generates a long-lived refresh JWT (7d) used to obtain new access tokens.
 *
 * @param paylaod - User identity payload (userId, email)
 * @returns Signed refresh JWT string
 */
export function generateRefreshToken(paylaod: JwtPayload): string {
    return jwt.sign(paylaod, process.env.REFRESH_JWT_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY, });
}

/**
 * Returns the refresh token expiration in milliseconds for cookie maxAge.
 */
export function getRefreshTokenExpiry(): number {
    return REFRESH_TOKEN_EXPIRY_MS;
}

/** Google OpenID Connect JSON Web Key Set for verifying Google ID tokens */
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);


// ============================================================================
// Registration & Password Authentication
// ============================================================================

/**
 * Registers a new user with email and password (unverified by default).
 * If an unverified account already exists with this email, updates its details to allow retry.
 *
 * @param body - Registration payload (email, password, name)
 * @throws {Error} "EMAIL_TAKEN" if an already verified user exists with this email
 * @returns Created or updated user record
 */
export async function registerUser(body: RegisterBody) {
    const existing = await prisma.user.findUnique({
        where: { email: body.email },
    });

    if(existing && existing.isVerified) {
        throw new Error("EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    if(existing && !existing.isVerified) {
        // Allow re-registration: update the unverified user's details
        const user = await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash, name: body.name },
        });
        return user;
    }

    const user = await prisma.user.create({
        data: {
            email: body.email,
            passwordHash,
            name: body.name,
        },
    });

    return user;
}

/**
 * Authenticates user credentials for email/password login.
 *
 * @param body - Login payload (email, password)
 * @throws {Error} "INVALID_CREDENTIALS" if user does not exist or password mismatch
 * @throws {Error} "EMAIL_NOT_VERIFIED" if email has not been confirmed via OTP
 * @returns Authenticated user record
 */
export async function loginUser(body: LoginBody) {
    const user = await prisma.user.findUnique({
        where: { email: body.email },
    });

    if(!user || !user.passwordHash) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);

    if(!valid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    if(!user.isVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
    }

    return user;
}

// ============================================================================
// Refresh Token Management (Redis)
// ============================================================================

/**
 * Stores a user's active refresh token in Redis with a 7-day TTL.
 *
 * @param userId - Authenticated user ID
 * @param token - Refresh JWT
 * @param redis - Redis client instance
 */
export async function storeRefreshToken(
    userId: string,
    token: string,
    redis: import("ioredis").Redis
): Promise<void> {
    await redis.set(
        `refresh:${userId}`,
        token,
        "PX",
        REFRESH_TOKEN_EXPIRY_MS
    );
}

/**
 * Validates whether the supplied refresh token matches the active session token in Redis.
 *
 * @param userId - Target user ID
 * @param token - Candidate refresh token
 * @param redis - Redis client instance
 * @returns Boolean indicating whether token is valid
 */
export async function validateRefreshToken(
    userId: string,
    token: string,
    redis: import("ioredis").Redis
): Promise<boolean> {
    const stored = await redis.get(`refresh:${userId}`)
    return stored === token;
}

/**
 * Deletes the active refresh token from Redis (used on logout).
 *
 * @param userId - Target user ID
 * @param redis - Redis client instance
 */
export async function deleteRefreshToken(
  userId: string,
  redis: import("ioredis").Redis
): Promise<void> {
  await redis.del(`refresh:${userId}`);
}

// ============================================================================
// Email Verification OTP (Redis + Resend)
// ============================================================================

/**
 * Generates a 6-digit numeric OTP and stores it in Redis for 10 minutes.
 *
 * @param userId - Target user ID
 * @param redis - Redis client instance
 * @returns 6-digit OTP string
 */
export async function generateOTP(
  userId: string,
  redis: import("ioredis").Redis
): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${userId}`, otp, "EX", OTP_TTL);

  return otp;
}

/**
 * Dispatches an account verification email containing the OTP via Resend.
 *
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 */
export async function sendVerificationEmail(
  email: string,
  otp: string
): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_EMAIL!,
    to: email,
    subject: "Verify your notify account",
    html: buildVerificationEmail(otp),
  });
}

/**
 * Verifies the user-submitted OTP against Redis.
 * If valid, marks the user's account as verified in PostgreSQL.
 *
 * @param userId - Target user ID
 * @param otp - User-submitted OTP string
 * @param redis - Redis client instance
 * @returns Boolean indicating verification success
 */
export async function verifyOtp(
  userId: string,
  otp: string,
  redis: import("ioredis").Redis
): Promise<boolean> {
  const stored = await redis.get(`otp:${userId}`);

  if(!stored || stored !== otp) return false;

  await redis.del(`otp:${userId}`);

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  return true;
}

/**
 * Resends a verification OTP to the user, enforcing a rate-limiting cooldown (2 minutes).
 *
 * @param userId - Target user ID
 * @param email - Target user email
 * @param redis - Redis client instance
 * @throws {Error} "RESEND_TOO_SOON" if less than 2 minutes have elapsed since last send
 */
export async function resendOTP(
  userId: string,
  email: string,
  redis: import("ioredis").Redis
): Promise<void> {
  const ttl = await redis.ttl(`otp:${userId}`);

  if(ttl > 8 * 60) {
    throw new Error("RESEND_TOO_SOON");
  }

  const otp = await generateOTP(userId, redis);
  await sendVerificationEmail(email, otp);
}

/**
 * Generates the HTML template for the email verification message.
 *
 * @param otp - 6-digit OTP code
 * @returns Clean HTML string formatted for email clients
 */
function buildVerificationEmail(otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

              <!-- logo -->
              <tr>
                <td style="padding-bottom:32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#ffffff;border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;">
                        <span style="color:#000;font-weight:700;font-size:14px;">N</span>
                      </td>
                      <td style="padding-left:8px;color:#ffffff;font-size:14px;font-weight:500;">
                        notify
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- card -->
              <tr>
                <td style="background:#141414;border:1px solid #262626;border-radius:12px;padding:32px;">
                  <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.3px;">
                    Verify your email
                  </h1>
                  <p style="margin:0 0 24px 0;color:#525252;font-size:13px;">
                    Enter this code in the verification page. It expires in 10 minutes.
                  </p>

                  <!-- OTP -->
                  <div style="background:#0d0d0d;border:1px solid #262626;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                    <span style="color:#ffffff;font-size:32px;font-weight:700;letter-spacing:0.5em;font-family:monospace;">
                      ${otp}
                    </span>
                  </div>

                  <p style="margin:0;color:#525252;font-size:12px;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- footer -->
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0;color:#333;font-size:11px;">
                    Sent by notify · notification infrastructure for developers
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============================================================================
// Google OAuth 2.0 & OIDC
// ============================================================================

/**
 * Builds the Google OAuth 2.0 authorization redirect URL.
 *
 * @param state - CSRF protection state parameter
 * @returns Google OAuth consent screen URL
 */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges a Google OAuth authorization code for ID/access tokens and verifies the token signature.
 *
 * @param code - Authorization code returned from Google callback
 * @returns Verified user profile from Google OIDC token
 */
export async function exchangeGoogleCode(code: string): Promise<{
  email: string;
  name: string;
  picture: string;
  googleId: string;
}> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json() as {
    id_token: string;
    access_token: string;
  };

  const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });

  return {
    googleId: payload.sub!,
    email: payload.email as string,
    name: payload.name as string,
    picture: payload.picture as string,
  };
}

/**
 * Finds an existing user by Google ID or email, or creates a new verified user record.
 * Automatically links Google accounts to existing accounts with matching email.
 *
 * @param profile - Verified profile information from Google
 * @returns Matched or newly created user record
 */
export async function findOrCreateGoogleUser(profile: {
  email: string;
  name: string;
  picture: string;
  googleId: string;
}) {

  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });

  if (user) return user;

  user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        picture: profile.picture,
      },
    });
    return user;
  }

  user = await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      googleId: profile.googleId,
    },
  });

  return user;
}
