"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "@/lib/api";
import { Channel, DeliveryStatus } from "@notify/types";
import {
  ScrollText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Mail,
  Webhook,
  Monitor,
  ChevronRight,
} from "lucide-react";

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

const CHANNEL_CONFIG = {
  EMAIL: {
    icon: <Mail className="w-3 h-3" />,
    label: "Email",
  },
  WEBHOOK: {
    icon: <Webhook className="w-3 h-3" />,
    label: "Webhook",
  },
  IN_APP: {
    icon: <Monitor className="w-3 h-3" />,
    label: "In-app",
  },
} as const;

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#141414] border border-[#262626] hover:border-[#333] text-sm rounded-lg px-3 py-2 pr-8 outline-none transition-colors cursor-pointer text-white focus:border-white"
      >
        <option value="" className="bg-[#141414] text-[#525252]">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#141414]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#525252] pointer-events-none" />
    </div>
  );
}

function LogRow({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG];
  const channel = CHANNEL_CONFIG[log.channel as keyof typeof CHANNEL_CONFIG];

  return (
    <>
      <div
        className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors cursor-pointer border-t border-[#262626] first:border-t-0"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* expand arrow */}
        <ChevronRight
          className={`w-3.5 h-3.5 text-[#333] transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />

        {/* event + subscriber */}
        <div className="min-w-0">
          <p className="text-white text-xs font-mono truncate">
            {log.notification.eventSlug}
          </p>
          <p className="text-[#525252] text-[10px] truncate mt-0.5">
            {log.notification.subscriber.externalId}
            {log.notification.subscriber.email && (
              <span className="text-[#333] ml-1">
                · {log.notification.subscriber.email}
              </span>
            )}
          </p>
        </div>

        {/* channel */}
        <div className="flex items-center gap-1.5 text-[#525252] text-xs shrink-0">
          {channel?.icon}
          <span className="hidden sm:inline">{channel?.label}</span>
        </div>

        {/* attempts */}
        <p className="text-[#525252] text-xs shrink-0">{log.attemptCount}x</p>

        {/* status */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shrink-0 ${status.color} ${status.bg}`}
        >
          {status.icon}
          <span className="hidden sm:inline">{status.label}</span>
        </div>
      </div>

      {/* expanded detail */}
      {expanded && (
        <div className="px-4 py-4 bg-[#0d0d0d] border-t border-[#262626]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
                Notification ID
              </p>
              <p className="text-white text-xs font-mono">
                {log.notification.id}
              </p>
            </div>
            <div>
              <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
                Delivery Log ID
              </p>
              <p className="text-white text-xs font-mono">{log.id}</p>
            </div>
            <div>
              <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
                Created
              </p>
              <p className="text-white text-xs">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
                Last attempt
              </p>
              <p className="text-white text-xs">
                {log.lastAttemptAt
                  ? new Date(log.lastAttemptAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            {log.failureReason && (
              <div className="sm:col-span-2">
                <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
                  Failure reason
                </p>
                <p className="text-red-400 text-xs font-mono bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2">
                  {log.failureReason}
                </p>
              </div>
            )}
          </div>

          {/* payload */}
          <div>
            <p className="text-[#525252] text-[10px] uppercase tracking-widest mb-1.5">
              Payload
            </p>
            <pre className="text-[#a3a3a3] text-xs font-mono bg-[#141414] border border-[#262626] rounded-lg px-3 py-3 overflow-x-auto">
              {JSON.stringify(log.notification.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

export default function LogsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", projectId, { status, channel, cursor }],
    queryFn: () =>
      getLogs(projectId, {
        status: (status as DeliveryStatus) || undefined,
        channel: (channel as Channel) || undefined,
        cursor,
        limit: 20,
      }),
  });

  function nextPage() {
    if (!data?.nextCursor) return;
    setCursorStack((p) => [...p, cursor ?? ""]);
    setCursor(data.nextCursor);
  }

  function prevPage() {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev === "" ? undefined : prev);
  }

  function resetFilters() {
    setStatus("");
    setChannel("");
    setCursor(undefined);
    setCursorStack([]);
  }

  const hasFilters = status || channel;

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Delivery Logs
          </h1>
          <p className="text-[#525252] text-sm mt-0.5">
            Track every notification delivery attempt
          </p>
        </div>
      </div>

      {/* filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="All statuses"
          options={[
            { value: DeliveryStatus.DELIVERED, label: "Delivered" },
            { value: DeliveryStatus.FAILED, label: "Failed" },
            { value: DeliveryStatus.PENDING, label: "Pending" },
            { value: DeliveryStatus.RETRYING, label: "Retrying" },
          ]}
        />
        <FilterSelect
          value={channel}
          onChange={(v) => {
            setChannel(v);
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="All channels"
          options={[
            { value: Channel.EMAIL, label: "Email" },
            { value: Channel.WEBHOOK, label: "Webhook" },
            { value: Channel.IN_APP, label: "In-app" },
          ]}
        />
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-[#525252] hover:text-white text-xs transition-colors px-2 py-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* logs table */}
      {isLoading ? (
        <div className="space-y-px">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-[#141414] border border-[#262626] rounded-xl animate-pulse mb-2"
            />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-4">
            <ScrollText className="w-5 h-5 text-[#525252]" />
          </div>
          <p className="text-white text-sm font-medium mb-1">
            {hasFilters ? "No logs match your filters" : "No logs yet"}
          </p>
          <p className="text-[#525252] text-xs">
            {hasFilters
              ? "Try adjusting or clearing your filters"
              : "Delivery logs will appear here once you start sending notifications"}
          </p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-white hover:text-zinc-300 text-xs transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
            {/* table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-[#262626]">
              <div className="w-3.5" />
              <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                Event / Subscriber
              </p>
              <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                Channel
              </p>
              <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                Attempts
              </p>
              <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
                Status
              </p>
            </div>

            {data?.items.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-[#525252] text-xs">
              {data?.items.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={cursorStack.length === 0}
                className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] text-[#a3a3a3] text-xs rounded-lg px-3 py-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={!data?.hasNextPage}
                className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] text-[#a3a3a3] text-xs rounded-lg px-3 py-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
