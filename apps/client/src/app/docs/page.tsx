import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { CodeBlock } from "@/components/CodeBlock";
import { SubSection } from "@/components/SubSection";
import { Param } from "@/components/Param";
import { Endpoint } from "@/components/Endpoint";
import { DocsSection as Section } from "@/components/DocSection";
import { DocsSidebar } from "@/components/DocSidebar";


export const metadata: Metadata = {
  title: "Documentation — Notify",
  description:
    "Complete integration guide for the Notify notification API. Learn how to send email, webhook, and in-app notifications with a single API call.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xs">N</span>
              </div>
              <span className="text-white font-medium text-sm tracking-tight">
                notify
              </span>
            </Link>
            <span className="text-[#262626]">/</span>
            <span className="text-[#525252] text-sm">Docs</span>
          </div>
          <Link
            href="/register"
            className="bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-3.5 py-1.5 transition-all"
          >
            Get started
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 flex gap-12">
        {/* sidebar — sticky nav */}
        <DocsSidebar />

        {/* main content */}
        <main className="flex-1 min-w-0 max-w-3xl">
          {/* ── Introduction ── */}
          <Section id="introduction" title="Introduction">
            <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4">
              Notify is a notification infrastructure API that lets you send
              email, webhook, and in-app notifications with a single API call.
              You define event types, register subscribers, and trigger
              notifications — we handle fan-out, retries, and delivery tracking.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Email",
                  desc: "Delivered via Resend with high inbox placement",
                },
                {
                  label: "Webhook",
                  desc: "HTTP POST to any endpoint with HMAC signature",
                },
                {
                  label: "In-app",
                  desc: "Real-time via Socket.IO, buffered for offline users",
                },
              ].map((ch) => (
                <div
                  key={ch.label}
                  className="bg-[#141414] border border-[#262626] rounded-lg p-3"
                >
                  <p className="text-white text-xs font-medium mb-1">
                    {ch.label}
                  </p>
                  <p className="text-[#525252] text-xs">{ch.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Quickstart ── */}
          <Section id="quickstart" title="Quickstart">
            <p className="text-[#525252] text-sm mb-6">
              Get up and running in under 5 minutes.
            </p>

            <SubSection id="quickstart-1" title="1. Create a project">
              <p className="text-[#525252] text-sm mb-4">
                Sign up at notify.dev, create a project, and copy your API key
                from the dashboard. Store it securely — it won't be shown again.
              </p>
            </SubSection>

            <SubSection id="quickstart-2" title="2. Install the SDK">
              <CodeBlock language="bash" code={`npm install @notify/sdk`} />
              <p className="text-[#525252] text-xs mt-2">
                Or use the REST API directly — no SDK required.
              </p>
            </SubSection>

            <SubSection id="quickstart-3" title="3. Register a subscriber">
              <CodeBlock
                language="typescript"
                label="SDK"
                code={`import { Notify } from "@notify/sdk";

const notify = new Notify({
  apiKey: process.env.NOTIFY_API_KEY!,
});

await notify.createSubscriber({
  externalId: "usr_123",         // your user's ID
  email: "user@example.com",
  webhookUrl: "https://your-server.com/webhooks",
});`}
              />
              <CodeBlock
                language="bash"
                label="REST"
                code={`curl -X POST https://api.notify.dev/v1/subscribers \\
  -H "Authorization: Bearer nk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "externalId": "usr_123",
    "email": "user@example.com",
    "webhookUrl": "https://your-server.com/webhooks"
  }'`}
              />
            </SubSection>

            <SubSection id="quickstart-4" title="4. Trigger a notification">
              <CodeBlock
                language="typescript"
                label="SDK"
                code={`const { notificationId } = await notify.trigger({
  eventSlug: "order.placed",
  subscriberId: "usr_123",
  payload: {
    orderId: "ord_999",
    amount: 299,
  },
  idempotencyKey: "ord_999_placed",
});

// returns 202 immediately
// delivery happens in background`}
              />
              <CodeBlock
                language="bash"
                label="REST"
                code={`curl -X POST https://api.notify.dev/v1/notify \\
  -H "Authorization: Bearer nk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventSlug": "order.placed",
    "subscriberId": "usr_123",
    "payload": { "orderId": "ord_999", "amount": 299 },
    "idempotencyKey": "ord_999_placed"
  }'`}
              />
            </SubSection>
          </Section>

          {/* ── Authentication ── */}
          <Section id="authentication" title="Authentication">
            <p className="text-[#525252] text-sm mb-6">
              All API requests require an API key passed in the{" "}
              <code className="text-white font-mono text-xs">
                Authorization
              </code>{" "}
              header.
            </p>
            <CodeBlock
              language="bash"
              code={`Authorization: Bearer nk_live_xxxx_secretpart`}
            />
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mt-4">
              <p className="text-white text-xs font-medium mb-2">Key format</p>
              <p className="text-[#525252] text-xs leading-relaxed">
                API keys follow the format{" "}
                <code className="text-white font-mono">
                  nk_live_{"<id>_<secret>"}
                </code>
                . The prefix is stored in plaintext for lookup — the full key is
                hashed and never stored raw. If you lose a key, revoke it from
                the dashboard and create a new one.
              </p>
            </div>
          </Section>

          {/* ── Projects ── */}
          <Section id="projects" title="Projects">
            <p className="text-[#525252] text-sm leading-relaxed mb-4">
              Projects are the top-level unit of organization. Each project gets
              its own API keys, event types, and subscribers. Use separate
              projects for different apps or environments (production/staging).
            </p>
          </Section>

          {/* ── Event Types ── */}
          <Section id="event-types" title="Event Types">
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              Event types define what notifications your app can send. Each
              event type has a slug and a list of channels it supports.
            </p>
            <CodeBlock
              language="typescript"
              label="Create an event type"
              code={`await notify.createEventType({
  slug: "order.placed",         // dot-separated, lowercase
  description: "Triggered when a customer places an order",
  channels: ["EMAIL", "WEBHOOK", "IN_APP"],
});`}
            />
            <p className="text-[#525252] text-xs mt-2">
              Slugs must match the pattern{" "}
              <code className="text-white font-mono">lowercase.dotted</code> —
              e.g. <code className="text-white font-mono">user.signup</code>,{" "}
              <code className="text-white font-mono">payment.failed</code>.
            </p>
          </Section>

          {/* ── Subscribers ── */}
          <Section id="subscribers" title="Subscribers">
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              Subscribers are your end users. Register them with their
              externalId (your internal user ID), email, and optional webhook
              URL. Calling createSubscriber twice with the same externalId
              updates the subscriber — it's idempotent.
            </p>
            <CodeBlock
              language="typescript"
              code={`// register or update a subscriber
await notify.createSubscriber({
  externalId: "usr_123",
  email: "user@example.com",
  webhookUrl: "https://their-server.com/webhooks",
});

// delete a subscriber
await notify.deleteSubscriber("usr_123");`}
            />
          </Section>

          {/* ── Preferences ── */}
          <Section id="preferences" title="Preferences">
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              Subscribers can opt in or out of specific channels per event type.
              If no preferences are set, the subscriber receives all channels
              the event type supports.
            </p>
            <CodeBlock
              language="typescript"
              code={`await notify.updatePreferences("usr_123", {
  preferences: [
    {
      eventSlug: "order.placed",
      channel: "EMAIL",
      enabled: true,
    },
    {
      eventSlug: "order.placed",
      channel: "WEBHOOK",
      enabled: false,   // opted out of webhook for this event
    },
  ],
});`}
            />
          </Section>

          {/* ── API Reference ── */}
          <Section id="trigger" title="Trigger Notification">
            <Endpoint
              method="POST"
              path="/v1/notify"
              description="Fan-out a notification to all enabled channels"
            />
            <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-[#262626]">
                <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                  Request body
                </p>
              </div>
              <div className="px-4 divide-y divide-[#1a1a1a]">
                <Param
                  name="eventSlug"
                  type="string"
                  required
                  description="The slug of the event type to trigger"
                />
                <Param
                  name="subscriberId"
                  type="string"
                  required
                  description="The externalId of the subscriber to notify"
                />
                <Param
                  name="payload"
                  type="object"
                  required
                  description="Arbitrary JSON data included in the notification"
                />
                <Param
                  name="idempotencyKey"
                  type="string"
                  description="Optional unique key to prevent duplicate deliveries on retry"
                />
              </div>
            </div>
            <CodeBlock
              language="json"
              label="Response — 202 Accepted"
              code={`{
  "notificationId": "ntf_cmsroi1fi00025...",
  "duplicate": false
}`}
            />
          </Section>

          {/* ── Subscribers API ── */}
          <Section id="subscribers-api" title="Subscribers API">
            <Endpoint
              method="POST"
              path="/v1/subscribers"
              description="Register or update a subscriber"
            />
            <Endpoint
              method="GET"
              path="/v1/subscribers/:externalId"
              description="Get a subscriber"
            />
            <Endpoint
              method="DELETE"
              path="/v1/subscribers/:externalId"
              description="Delete a subscriber"
            />
            <Endpoint
              method="GET"
              path="/v1/subscribers/:externalId/preferences"
              description="Get notification preferences"
            />
            <Endpoint
              method="PATCH"
              path="/v1/subscribers/:externalId/preferences"
              description="Update notification preferences"
            />
          </Section>

          {/* ── Events API ── */}
          <Section id="events-api" title="Event Types API">
            <Endpoint
              method="GET"
              path="/v1/events"
              description="List all event types"
            />
            <Endpoint
              method="POST"
              path="/v1/events"
              description="Create an event type"
            />
            <Endpoint
              method="DELETE"
              path="/v1/events/:slug"
              description="Delete an event type"
            />
          </Section>

          {/* ── Logs API ── */}
          <Section id="logs-api" title="Delivery Logs API">
            <Endpoint
              method="GET"
              path="/v1/logs"
              description="List delivery logs with filters"
            />
            <Endpoint
              method="GET"
              path="/v1/logs/:logId"
              description="Get a specific delivery log"
            />
            <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden mt-4">
              <div className="px-4 py-3 border-b border-[#262626]">
                <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                  Query parameters
                </p>
              </div>
              <div className="px-4 divide-y divide-[#1a1a1a]">
                <Param
                  name="status"
                  type="string"
                  description="Filter by status: DELIVERED, FAILED, PENDING, RETRYING"
                />
                <Param
                  name="channel"
                  type="string"
                  description="Filter by channel: EMAIL, WEBHOOK, IN_APP"
                />
                <Param
                  name="cursor"
                  type="string"
                  description="Cursor for pagination — from nextCursor in previous response"
                />
                <Param
                  name="limit"
                  type="number"
                  description="Number of results per page — default 20, max 100"
                />
              </div>
            </div>
          </Section>

          {/* ── Webhook Verification ── */}
          <Section id="webhooks" title="Webhook Verification">
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              Every webhook request is signed with HMAC-SHA256 using your
              project's webhook secret. Always verify the signature before
              processing the payload.
            </p>
            <CodeBlock
              language="typescript"
              label="Verify with SDK"
              code={`import { Notify } from "@notify/sdk";

app.post("/webhooks", (req, res) => {
  const isValid = Notify.verifyWebhook(
    JSON.stringify(req.body),
    req.headers["x-notify-signature"] as string,
    process.env.NOTIFY_WEBHOOK_SECRET!,
  );

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, payload, timestamp } = req.body;
  // handle the event...

  res.json({ ok: true }); // must return 2xx
});`}
            />
            <CodeBlock
              language="typescript"
              label="Verify manually"
              code={`import crypto from "crypto";

const signature = req.headers["x-notify-signature"]; // "sha256=abc..."
const body = JSON.stringify(req.body);

const expected = crypto
  .createHmac("sha256", process.env.NOTIFY_WEBHOOK_SECRET!)
  .update(body)
  .digest("hex");

const trusted = \`sha256=\${expected}\`;

// timing-safe comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(trusted),
  Buffer.from(signature),
);`}
            />
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mt-2">
              <p className="text-white text-xs font-medium mb-3">
                Request headers
              </p>
              <div className="space-y-2">
                {[
                  {
                    header: "X-Notify-Signature",
                    value: "sha256=<hmac>",
                    desc: "HMAC-SHA256 signature of the request body",
                  },
                  {
                    header: "X-Notify-Timestamp",
                    value: "ISO 8601",
                    desc: "Time the webhook was sent",
                  },
                  {
                    header: "X-Notify-Event",
                    value: "string",
                    desc: "The event slug that triggered this webhook",
                  },
                  {
                    header: "X-Notify-Project",
                    value: "string",
                    desc: "Your project ID",
                  },
                ].map((h) => (
                  <div
                    key={h.header}
                    className="flex items-start gap-3 text-xs"
                  >
                    <code className="text-white font-mono w-48 shrink-0">
                      {h.header}
                    </code>
                    <code className="text-[#525252] font-mono w-20 shrink-0">
                      {h.value}
                    </code>
                    <p className="text-[#525252]">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── SDK ── */}
          <Section id="sdk" title="SDK Usage">
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              The official SDK wraps the REST API with full TypeScript support.
            </p>
            <CodeBlock language="bash" code={`npm install @notify/sdk`} />
            <CodeBlock
              language="typescript"
              code={`import { Notify, NotifySDKError } from "@notify/sdk";

const notify = new Notify({
  apiKey: process.env.NOTIFY_API_KEY!,
  baseUrl: "https://api.notify.dev", // optional
});

// error handling
try {
  await notify.trigger({
    eventSlug: "order.placed",
    subscriberId: "usr_123",
    payload: { orderId: "ord_999" },
  });
} catch (err) {
  if (err instanceof NotifySDKError) {
    console.error(err.status, err.message);
    // 404 — event type not found
    // 401 — invalid API key
    // 429 — rate limit exceeded
  }
}`}
            />
          </Section>

          {/* ── Idempotency ── */}
          <Section id="idempotency" title="Idempotency">
            <p className="text-[#525252] text-sm leading-relaxed mb-4">
              Pass an{" "}
              <code className="text-white font-mono text-xs">
                idempotencyKey
              </code>{" "}
              to prevent duplicate notifications when retrying failed requests.
              If we receive the same key twice within 24 hours, we return the
              original response without triggering a second delivery.
            </p>
            <CodeBlock
              language="typescript"
              code={`await notify.trigger({
  eventSlug: "payment.processed",
  subscriberId: "usr_123",
  payload: { amount: 999 },
  idempotencyKey: \`payment_\${paymentId}_processed\`,
  // safe to retry — will never double-deliver
});`}
            />
            <p className="text-[#525252] text-xs mt-2">
              Use a meaningful key — combine the resource ID with the event slug
              so it's naturally unique per occurrence.
            </p>
          </Section>

          {/* ── Channels ── */}
          <Section id="channels" title="Channels">
            <div className="space-y-4">
              {[
                {
                  name: "EMAIL",
                  desc: "Sent via Resend to the subscriber's email address. Requires email on the subscriber.",
                  requires: "subscriber.email",
                },
                {
                  name: "WEBHOOK",
                  desc: "HTTP POST to the subscriber's webhookUrl with HMAC signature. Retried up to 5 times with exponential backoff on 5xx errors.",
                  requires: "subscriber.webhookUrl",
                },
                {
                  name: "IN_APP",
                  desc: "Emitted via Socket.IO in real time. Buffered in Redis for offline subscribers — delivered on next connect.",
                  requires: "socket connection",
                },
              ].map((ch) => (
                <div
                  key={ch.name}
                  className="bg-[#141414] border border-[#262626] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-white text-xs font-mono font-medium">
                      {ch.name}
                    </code>
                    <span className="text-[#333] text-[10px] font-mono">
                      requires: {ch.requires}
                    </span>
                  </div>
                  <p className="text-[#525252] text-xs leading-relaxed">
                    {ch.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* navigation footer */}
          <div className="flex items-center justify-between pt-8 border-t border-[#262626]">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#525252] hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-4 py-2 transition-all"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
