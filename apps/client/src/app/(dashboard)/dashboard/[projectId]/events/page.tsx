"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventType, getEventTypes, deleteEventType } from "@/lib/api";
import { useParams } from "next/navigation";
import { Channel } from "@notify/types";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Zap,
  Mail,
  Webhook,
  Monitor,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const CHANNEL_CONFIG = {
  EMAIL: {
    icon: <Mail className="w-3 h-3" />,
    label: "Email",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  WEBHOOK: {
    icon: <Webhook className="w-3 h-3" />,
    label: "Webhook",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  IN_APP: {
    icon: <Monitor className="w-3 h-3" />,
    label: "In-app",
    color: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
  },
} as const;

function DeleteEventDialog({
  slug,
  projectId,
  onClose,
}: {
  slug: string;
  projectId: string;
  onClose: () => void;
}) {
  const query = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteEventType(projectId, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes", projectId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Delete event type</p>
            <p className="text-[#525252] text-xs font-mono">{slug}</p>
          </div>
        </div>
        <p className="text-[#a3a3a3] text-xs mb-6 leading-relaxed">
          Deleting this event type will not affect already delivered
          notifications but any future calls with this slug will fail.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#262626] text-[#a3a3a3] text-sm rounded-lg px-4 py-2 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventTypesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([
    Channel.EMAIL,
  ]);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [slugError, setSlugError] = useState("");

  const { data: eventTypes, isLoading } = useQuery({
    queryKey: ["eventTypes", projectId],
    queryFn: () => getEventTypes(projectId),
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      createEventType(projectId, {
        slug,
        description: description || undefined,
        channels: selectedChannels,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes", projectId] });
      setCreating(false);
      setSlug("");
      setDescription("");
      setSelectedChannels([Channel.EMAIL]);
      setSlugError("");
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setSlugError("This slug already exists");
      } else if (err?.response?.status === 400) {
        setSlugError("Slug must be like order.placed (lowercase, dots only)");
      } else {
        setSlugError("Something went wrong");
      }
    },
  });

  function toggleChannel(channel: Channel) {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugError("");
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Event Types
          </h1>
          <p className="text-[#525252] text-sm mt-0.5">
            Define the notification events your app can trigger
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-3.5 py-2 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          New event
        </button>
      </div>

      {/* create form */}
      {creating && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 mb-6">
          <p className="text-white text-sm font-medium mb-4">New event type</p>

          <div className="space-y-4">
            {/* slug */}
            <div>
              <label className="text-[#a3a3a3] text-xs mb-1.5 block">
                Slug
                <span className="text-[#525252] ml-1.5">
                  e.g. order.placed, user.signup
                </span>
              </label>
              <input
                autoFocus
                placeholder="order.placed"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-sm font-mono placeholder:text-[#525252] rounded-lg px-3 py-2 outline-none transition-colors"
              />
              {slugError && (
                <p className="text-red-400 text-xs mt-1.5">{slugError}</p>
              )}
            </div>

            {/* description */}
            <div>
              <label className="text-[#a3a3a3] text-xs mb-1.5 block">
                Description
                <span className="text-[#525252] ml-1.5">optional</span>
              </label>
              <input
                placeholder="Triggered when a user places an order"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-sm placeholder:text-[#525252] rounded-lg px-3 py-2 outline-none transition-colors"
              />
            </div>

            {/* channels */}
            <div>
              <label className="text-[#a3a3a3] text-xs mb-2 block">
                Channels
              </label>
              <div className="flex gap-2">
                {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
                  const channel = key as Channel;
                  const selected = selectedChannels.includes(channel);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? `${config.color} ${config.bg} border-transparent`
                          : "text-[#525252] bg-transparent border-[#262626] hover:border-[#333]"
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
              {selectedChannels.length === 0 && (
                <p className="text-red-400 text-xs mt-1.5">
                  Select at least one channel
                </p>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => {
                setCreating(false);
                setSlug("");
                setDescription("");
                setSelectedChannels([Channel.EMAIL]);
                setSlugError("");
              }}
              className="text-[#525252] hover:text-white text-sm transition-colors px-3 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!slug.trim()) {
                  setSlugError("Slug is required");
                  return;
                }
                if (selectedChannels.length === 0) return;
                create();
              }}
              disabled={
                isPending || !slug.trim() || selectedChannels.length === 0
              }
              className="bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-4 py-2 transition-all disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create event"}
            </button>
          </div>
        </div>
      )}

      {/* event types list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[#141414] border border-[#262626] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : eventTypes?.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-4">
            <Bell className="w-5 h-5 text-[#525252]" />
          </div>
          <p className="text-white text-sm font-medium mb-1">
            No event types yet
          </p>
          <p className="text-[#525252] text-xs mb-4">
            Define events like{" "}
            <code className="font-mono text-[#a3a3a3]">order.placed</code> or{" "}
            <code className="font-mono text-[#a3a3a3]">user.signup</code>
          </p>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create event type
          </button>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          {/* table header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-[#262626]">
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Slug
            </p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Channels
            </p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Actions
            </p>
          </div>

          {eventTypes?.map((event, i) => (
            <div
              key={event.id}
              className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors ${
                i !== 0 ? "border-t border-[#262626]" : ""
              }`}
            >
              {/* slug + description */}
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-[#525252] shrink-0" />
                  <p className="text-white text-sm font-mono">{event.slug}</p>
                </div>
                {event.description && (
                  <p className="text-[#525252] text-xs mt-0.5 pl-5 truncate">
                    {event.description}
                  </p>
                )}
              </div>

              {/* channels */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {event.channels.map((channel) => {
                  const config = CHANNEL_CONFIG[channel];
                  return (
                    <div
                      key={channel}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${config.color} ${config.bg}`}
                    >
                      {config.icon}
                      {config.label}
                    </div>
                  );
                })}
              </div>

              {/* delete */}
              <button
                onClick={() => setDeletingSlug(event.slug)}
                className="text-[#525252] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* delete dialog */}
      {deletingSlug && (
        <DeleteEventDialog
          slug={deletingSlug}
          projectId={projectId}
          onClose={() => setDeletingSlug(null)}
        />
      )}
    </div>
  );
}
