import { prisma } from "@notify/db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type {
  APIKeyBody,
  CreateProjectBody,
  UpdateProjectBody,
} from "../validators/project.validator.js";
import crypto from "crypto";

// ============================================================================
// Projects Service
// Handles project CRUD operations and related entity counters.
// ============================================================================

/**
 * Retrieves all projects owned by a specific user.
 * Includes counts for subscribers, sent notifications, and active (non-revoked) API keys.
 *
 * @param userId - ID of the authenticated user
 * @returns Array of projects with nested entity counts
 */
export function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          subscribers: true,
          notification: true,
          apiKeys: {
            where: { revokedAt: null }, // Only count active keys
          },
        },
      },
    },
  });
}

/**
 * Retrieves a single project by its ID and validates user ownership.
 *
 * @param projectId - Target project ID
 * @param userId - Authenticated user ID requesting the project
 * @throws {Error} "NOT_FOUND" if the project doesn't exist
 * @throws {Error} "FORBIDDEN" if the project belongs to another user
 * @returns Full project details including webhook secret and entity counts
 */
export async function getProjectById(projectId: string, userId: string) {
  const projects = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          subscribers: true,
          notification: true,
          apiKeys: {
            where: { revokedAt: null },
          },
        },
      },
    },
  });

  if (!projects) throw new Error("NOT_FOUND");
  if (projects.userId !== userId) throw new Error("FORBIDDEN");
  return projects;
}

/**
 * Creates a new project for a user.
 * Automatically generates a unique webhook signing secret (whsec_...) used for HMAC-SHA256 signatures.
 *
 * @param body - Validated payload containing project name
 * @param userId - ID of the user creating the project
 * @returns Newly created project record
 */
export async function createProject(body: CreateProjectBody, userId: string) {
  // Generate a cryptographically secure 64-char hex secret prefixed with 'whsec_'
  const webhookSecret = `whsec_${crypto.randomBytes(32).toString("hex")}`;

  return prisma.project.create({
    data: {
      name: body.name,
      userId,
      webhookSecret,
    },
  });
}

/**
 * Updates an existing project's metadata (e.g. name).
 * Enforces ownership before performing the update.
 *
 * @param projectId - Target project ID
 * @param userId - Authenticated user ID
 * @param body - Fields to update
 * @returns Updated project record
 */
export async function updateProject(
  projectId: string,
  userId: string,
  body: UpdateProjectBody,
) {
  await assertProjectOwnership(projectId, userId);

  return prisma.project.update({
    where: { id: projectId },
    data: { name: body.name },
  });
}

/**
 * Deletes a project and cascades deletion to related resources (subscribers, keys, etc.).
 * Enforces ownership before deleting.
 *
 * @param projectId - Target project ID
 * @param userId - Authenticated user ID
 * @returns Deleted project record
 */
export async function deleteProject(projectId: string, userId: string) {
  await assertProjectOwnership(projectId, userId);

  return prisma.project.delete({
    where: { id: projectId },
  });
}

// ============================================================================
// API Key Management Service
// Handles secure generation, storage, and revocation of project API keys.
//
// Security Architecture:
// - API Key format: nk_live_<8-char-prefix>_<32-char-secret>
// - The full rawKey is returned ONCE upon creation.
// - The database only stores a bcrypt hash and the searchable prefix (for identification).
// ============================================================================

/**
 * Lists all active (non-revoked) API keys for a project.
 * Only returns public metadata (prefix, name, usage timestamps), never the full secret.
 *
 * @param projectId - Target project ID
 * @param userId - Authenticated user ID
 * @returns List of active API key metadata
 */
export async function getApiKey(projectId: string, userId: string) {
  await assertProjectOwnership(projectId, userId);

  return prisma.apiKey.findMany({
    where: { projectId, revokedAt: null },
    select: {
      id: true,
      prefix: true,
      name: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Generates and stores a new API key for a project.
 *
 * @param projectId - Target project ID
 * @param userId - Authenticated user ID
 * @param body - Validated payload containing key name
 * @returns An object containing the raw key (shown only once) and its prefix
 */
export async function createApiKey(
  projectId: string,
  userId: string,
  body: APIKeyBody,
) {
  await assertProjectOwnership(projectId, userId);

  // 1. Generate random key segments
  const secret = nanoid(32);
  const prefix = `nk_live_${nanoid(8)}`;
  const rawKey = `${prefix}_${secret}`;

  // 2. Hash the raw key using bcrypt (never store raw keys in DB)
  const hashKey = await bcrypt.hash(rawKey, 10);

  // 3. Store prefix + hash in the database
  await prisma.apiKey.create({
    data: {
      projectId,
      prefix,
      hash: hashKey,
      name: body.name,
    },
  });

  // 4. Return the full rawKey to the user (this is the ONLY time they can see it)
  return { key: rawKey, prefix };
}

/**
 * Revokes (soft-deletes) an API key by setting its revokedAt timestamp.
 *
 * @param keyId - Target API key ID
 * @param projectId - Project ID the key belongs to
 * @param userId - Authenticated user ID
 * @returns Updated API key record
 */
export async function revokeApiKey(
  keyId: string,
  projectId: string,
  userId: string,
) {
  await assertProjectOwnership(projectId, userId);

  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
  });

  if (!key || key.projectId !== projectId) throw new Error("NOT_FOUND");

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Verifies that a project exists and is owned by the specified user.
 * Throws an error immediately if the check fails to prevent unauthorized access.
 *
 * @param projectId - Project ID to verify
 * @param userId - User ID claiming ownership
 * @throws {Error} "NOT_FOUND" if project doesn't exist
 * @throws {Error} "FORBIDDEN" if project belongs to someone else
 */
export async function assertProjectOwnership(
  projectId: string,
  userId: string,
) {
  const projects = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!projects) throw new Error("NOT_FOUND");
  if (projects.userId !== userId) throw new Error("FORBIDDEN");
}
