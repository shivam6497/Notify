"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  Mail,
  Webhook,
  Search,
} from "lucide-react";

interface Subscriber {
  id: string;
  externalId: string;
  email: string | null;
  webhookUrl: string | null;
  createdAt: string;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
}

async function getSubscribers(projectId: string): Promise<Subscriber[]> {
  const res = await api.get<SubscribersResponse>("/v1/subscribers", {
    params: { projectId },
  });
  return res.data.subscribers;
}

async function deleteSubscriber(
  projectId: string,
  externalId: string,
): Promise<void> {
  await api.delete(`/v1/subscribers/${externalId}`, {
    params: { projectId },
  });
}

function DeleteSubscriberDialog({
  externalId,
  projectId,
  onClose,
}: {
  externalId: string;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteSubscriber(projectId, externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
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
            <p className="text-white text-sm font-medium">Delete subscriber</p>
            <p className="text-[#525252] text-xs font-mono">{externalId}</p>
          </div>
        </div>
        <p className="text-[#a3a3a3] text-xs mb-6 leading-relaxed">
          This will delete the subscriber and all their notification
          preferences. Delivery logs will be preserved.
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

export default function SubscribersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["subscribers", projectId],
    queryFn: () => getSubscribers(projectId),
  });

  const filtered = subscribers?.filter(
    (s) =>
      s.externalId.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Subscribers
          </h1>
          <p className="text-[#525252] text-sm mt-0.5">
            End users registered to receive notifications
          </p>
        </div>
        {/* subscribers are created via API, not dashboard */}
        <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-lg px-3 py-2">
          <code className="text-[#525252] text-xs font-mono">
            POST /v1/subscribers
          </code>
        </div>
      </div>

      {/* search */}
      {(subscribers?.length ?? 0) > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#525252]" />
          <input
            placeholder="Search by ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] focus:border-white text-white text-sm placeholder:text-[#525252] rounded-lg pl-9 pr-4 py-2 outline-none transition-colors"
          />
        </div>
      )}

      {/* list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[#141414] border border-[#262626] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : subscribers?.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-[#525252]" />
          </div>
          <p className="text-white text-sm font-medium mb-1">
            No subscribers yet
          </p>
          <p className="text-[#525252] text-xs mb-4 max-w-xs">
            Subscribers are created via the API when your users sign up or
            perform actions in your app
          </p>
          <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 font-mono text-xs text-left">
            <p className="text-[#525252]">POST /v1/subscribers</p>
            <p className="text-[#525252] mt-1">{"{"}</p>
            <p className="text-[#525252] pl-4">
              "externalId": <span className="text-white">"usr_123"</span>,
            </p>
            <p className="text-[#525252] pl-4">
              "email": <span className="text-white">"user@example.com"</span>
            </p>
            <p className="text-[#525252]">{"}"}</p>
          </div>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-8 text-center">
          <p className="text-[#525252] text-sm">
            No subscribers match{" "}
            <span className="text-white font-mono">"{search}"</span>
          </p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          {/* table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-[#262626]">
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              External ID
            </p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Email
            </p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Webhook
            </p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">
              Actions
            </p>
          </div>

          {filtered?.map((subscriber, i) => (
            <div
              key={subscriber.id}
              className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors ${
                i !== 0 ? "border-t border-[#262626]" : ""
              }`}
            >
              {/* external id */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-medium">
                    {subscriber.externalId[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-xs font-mono truncate">
                  {subscriber.externalId}
                </p>
              </div>

              {/* email */}
              <div className="flex items-center gap-1.5 min-w-0">
                {subscriber.email ? (
                  <>
                    <Mail className="w-3 h-3 text-[#525252] shrink-0" />
                    <p className="text-[#a3a3a3] text-xs truncate">
                      {subscriber.email}
                    </p>
                  </>
                ) : (
                  <p className="text-[#333] text-xs">—</p>
                )}
              </div>

              {/* webhook */}
              <div className="flex items-center gap-1.5 min-w-0">
                {subscriber.webhookUrl ? (
                  <>
                    <Webhook className="w-3 h-3 text-[#525252] shrink-0" />
                    <p className="text-[#a3a3a3] text-xs truncate">
                      {subscriber.webhookUrl}
                    </p>
                  </>
                ) : (
                  <p className="text-[#333] text-xs">—</p>
                )}
              </div>

              {/* delete */}
              <button
                onClick={() => setDeletingId(subscriber.externalId)}
                className="text-[#525252] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* count */}
      {(subscribers?.length ?? 0) > 0 && (
        <p className="text-[#333] text-xs mt-4">
          {filtered?.length} of {subscribers?.length} subscribers
        </p>
      )}

      {deletingId && (
        <DeleteSubscriberDialog
          externalId={deletingId}
          projectId={projectId}
          onClose={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
