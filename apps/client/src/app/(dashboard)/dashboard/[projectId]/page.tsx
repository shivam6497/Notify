"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/api";
import { getLogs } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Key,
  Bell,
  Users,
  ScrollText,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Copy,
} from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
      <p className="text-[#525252] text-xs mb-2">{label}</p>
      <p className="text-white text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {sub && <p className="text-[#525252] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] rounded-xl p-4 flex items-center justify-between group transition-all duration-150"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-[#525252] group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          <p className="text-[#525252] text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#525252] transition-colors" />
    </Link>
  );
}

const STATUS_CONFIG = {
  DELIVERED: {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    label: "Delivered",
  },
  FAILED: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "Failed",
  },
  PENDING: {
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "text-[#525252]",
    bg: "bg-[#1a1a1a]",
    label: "Pending",
  },
  RETRYING: {
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "Retrying",
  },
} as const;

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["logs", projectId, { limit: 5 }],
    queryFn: () => getLogs(projectId, { limit: 5 }),
  });

  if (projectLoading) {
    return (
      <div className="flex-1 p-6 md:p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-7 w-48 bg-[#141414] rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-[#141414] rounded-xl border border-[#262626]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const subscriberCount = project._count.subscribers ?? 0;
  const notificationCount = project._count.notifications ?? 0;
  const apiKeyCount = project._count.apiKeys ?? 0;

  const delivered =
    logs?.items.filter((l) => l.status === "DELIVERED").length ?? 0;
  const total = logs?.items.length ?? 0;
  const deliveryRate =
    total > 0 ? `${Math.round((delivered / total) * 100)}%` : "—";
  const deliveryRateSub = total > 0 ? "last 5 deliveries" : "no data yet";

  async function handleCopySecret() {
    if (!project) return;
    await navigator.clipboard.writeText(project.webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
            <span className="text-white text-[10px] font-medium">
              {project.name[0]?.toUpperCase()}
            </span>
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            {project.name}
          </h1>
        </div>
        <p className="text-[#525252] text-sm">
          Project overview and quick access
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Subscribers"
          value={subscriberCount}
          sub="registered"
        />
        <StatCard
          label="Notifications"
          value={notificationCount}
          sub="total sent"
        />
        <StatCard label="API Keys" value={apiKeyCount} sub="active" />
        <StatCard
          label="Delivery rate"
          value={deliveryRate}
          sub={deliveryRateSub}
        />
      </div>

      {/* webhook secret */}
      <div className="mb-8">
        <p className="text-[#525252] text-xs font-medium uppercase tracking-widest mb-3">
          Webhook Secret
        </p>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-white text-sm font-medium mb-0.5">
                Signing secret
              </p>
              <p className="text-[#525252] text-xs">
                Use this to verify webhook requests came from notify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2.5">
            <code className="flex-1 text-white text-xs font-mono truncate">
              {showSecret
                ? project.webhookSecret
                : "whsec_••••••••••••••••••••••••••••••••"}
            </code>
            <button
              onClick={() => setShowSecret((p) => !p)}
              className="text-[#525252] hover:text-white transition-colors p-1 shrink-0"
            >
              {showSecret ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleCopySecret}
              className="text-[#525252] hover:text-white transition-colors p-1 shrink-0"
            >
              {copiedSecret ? (
                <Check className="w-3.5 h-3.5 text-[#22c55e]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* verification code snippet */}
          <div className="mt-4 bg-[#0d0d0d] border border-[#262626] rounded-lg p-3 font-mono text-xs">
            <p className="text-[#525252] mb-2">// verify on your server</p>
            <p className="text-[#525252]">
              {"const sig = req.headers["}
              <span className="text-white">"x-notify-signature"</span>
              {"];"}
            </p>
            <p className="text-[#525252] mt-1">
              {"const expected = crypto.createHmac("}
              <span className="text-white">"sha256"</span>
              {", secret)"}
            </p>
            <p className="text-[#525252] pl-4">
              {".update(JSON.stringify(req.body))"}
            </p>
            <p className="text-[#525252] pl-4">{'.digest("hex");'}</p>
            <p className="text-[#525252] mt-1">
              {"if (sig !== "}
              <span className="text-white">
                `sha256=${"{"}expected{"}"}`
              </span>
              {") throw new Error("}
              <span className="text-white">"Invalid signature"</span>
              {");"}
            </p>
          </div>
        </div>
      </div>

      {/* quick links */}
      <div className="mb-8">
        <p className="text-[#525252] text-xs font-medium uppercase tracking-widest mb-3">
          Manage
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickLink
            href={`/dashboard/${projectId}/keys`}
            icon={<Key className="w-4 h-4" />}
            label="API Keys"
            description="Create and revoke keys"
          />
          <QuickLink
            href={`/dashboard/${projectId}/events`}
            icon={<Bell className="w-4 h-4" />}
            label="Event Types"
            description="Define notification events"
          />
          <QuickLink
            href={`/dashboard/${projectId}/subscribers`}
            icon={<Users className="w-4 h-4" />}
            label="Subscribers"
            description="Manage your end users"
          />
          <QuickLink
            href={`/dashboard/${projectId}/logs`}
            icon={<ScrollText className="w-4 h-4" />}
            label="Delivery Logs"
            description="Track notification delivery"
          />
        </div>
      </div>

      {/* recent logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#525252] text-xs font-medium uppercase tracking-widest">
            Recent activity
          </p>
          <Link
            href={`/dashboard/${projectId}/logs`}
            className="text-[#525252] hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-[#141414] border border-[#262626] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : logs?.items.length === 0 ? (
          <div className="border border-dashed border-[#262626] rounded-xl p-8 text-center">
            <p className="text-[#525252] text-sm">No activity yet</p>
            <p className="text-[#333] text-xs mt-1">
              Notifications will appear here once you start sending
            </p>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
            {logs?.items.map((log, i) => {
              const config = STATUS_CONFIG[log.status];
              return (
                <div
                  key={log.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                    i !== 0 ? "border-t border-[#262626]" : ""
                  }`}
                  onClick={() => router.push(`/dashboard/${projectId}/logs`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shrink-0 ${config.color} ${config.bg}`}
                    >
                      {config.icon}
                      {config.label}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-mono truncate">
                        {log.notification.eventSlug}
                      </p>
                      <p className="text-[#525252] text-[10px] truncate">
                        {log.notification.subscriber.externalId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[#525252] text-[10px]">{log.channel}</p>
                    <p className="text-[#333] text-[10px]">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
