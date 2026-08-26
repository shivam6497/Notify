import { Resend } from "resend";
import { prisma } from "@notify/db";
import type { Job } from "@notify/queue";
import type { EmailJobPayload } from "@notify/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function emailProcessor(job: Job<EmailJobPayload>): Promise<void> {
  const { deliveryLogId, to, eventSlug, payload } = job.data;

  if (job.attemptsMade > 0) {
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "RETRYING",
        attemptCount: job.attemptsMade,
        lastAttemptAt: new Date(),
      },
    });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_EMAIL!,
      to,
      subject: `Notification ${eventSlug}`,
      html: buildEmailHtml(eventSlug, payload),
    });

    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "DELIVERED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: null,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unkown error";

    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: {
        status: "FAILED",
        attemptCount: job.attemptsMade + 1,
        lastAttemptAt: new Date(),
        failureReason: errorMessage,
      },
    });

    throw error;
  }
}

function buildEmailHtml(
  eventSlug: string,
  payload: Record<string, unknown>,
): string {
  const title = eventSlug
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const rows = Object.entries(payload)
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding: 8px 0; color: #525252; font-size: 13px; border-bottom: 1px solid #1a1a1a; white-space: nowrap; padding-right: 24px;">
            ${key}
          </td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 13px; border-bottom: 1px solid #1a1a1a; font-family: monospace;">
            ${String(value)}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d0d0d; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">

              <!-- header -->
              <tr>
                <td style="padding-bottom: 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color: #ffffff; border-radius: 8px; width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                        <span style="color: #000000; font-weight: 700; font-size: 14px;">N</span>
                      </td>
                      <td style="padding-left: 8px; color: #ffffff; font-size: 14px; font-weight: 500;">
                        notify
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- card -->
              <tr>
                <td style="background-color: #141414; border: 1px solid #262626; border-radius: 12px; padding: 32px;">

                  <!-- event badge -->
                  <div style="display: inline-block; background-color: #1a1a1a; border: 1px solid #262626; border-radius: 6px; padding: 4px 10px; margin-bottom: 20px;">
                    <span style="color: #a3a3a3; font-size: 11px; font-family: monospace;">${eventSlug}</span>
                  </div>

                  <!-- title -->
                  <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">
                    ${title}
                  </h1>
                  <p style="margin: 0 0 24px 0; color: #525252; font-size: 13px;">
                    A new notification was triggered for your account.
                  </p>

                  <!-- divider -->
                  <div style="border-top: 1px solid #262626; margin-bottom: 24px;"></div>

                  <!-- payload table -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${rows}
                  </table>
                </td>
              </tr>

              <!-- footer -->
              <tr>
                <td style="padding-top: 24px; text-align: center;">
                  <p style="margin: 0; color: #333333; font-size: 11px;">
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
