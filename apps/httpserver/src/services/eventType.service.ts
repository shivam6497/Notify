import { prisma } from "@notify/db";
import type { CreateEventTypeBody } from "../validators/eventType.validator.js";

// ============================================================================
// Event Type Service
// Manages notification event types (topics/schemas) configured for a project.
// ============================================================================

/**
 * Retrieves all registered event types for a specific project.
 *
 * @param projectId - The target project ID
 * @returns List of event types ordered by newest first
 */
export async function getEventTypes(projectId: string) {
    return prisma.eventType.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Creates a new event type within a project.
 * Ensures the slug is unique per project.
 *
 * @param projectId - The target project ID
 * @param body - The event type payload (slug, description, enabled channels)
 * @throws {Error} "SLUG_TAKEN" if an event type with the same slug already exists in this project
 * @returns The newly created event type record
 */
export async function createEventType(
    projectId: string,
    body: CreateEventTypeBody
) {
    const existing = await prisma.eventType.findUnique({
        where: {
            projectId_slug: { projectId, slug: body.slug }
        },
    });
    
    if(existing) throw new Error("SLUG_TAKEN");

    return prisma.eventType.create({
        data: {
            projectId,
            slug: body.slug,
            description: body.description,
            channels: body.channels,
        },
    });
}

/**
 * Deletes an event type by its slug for a given project.
 *
 * @param projectId - The target project ID
 * @param slug - The unique slug identifier of the event type to delete
 * @throws {Error} "NOT_FOUND" if the event type does not exist
 * @returns The deleted event type record
 */
export async function deleteEventType(projectId: string, slug: string) {
    const existing = await prisma.eventType.findUnique({
        where: {
            projectId_slug: { projectId, slug }
        },
    });

    if(!existing) throw new Error("NOT_FOUND");

    return prisma.eventType.delete({
        where: {
            id: existing.id,
        },
    });
}

