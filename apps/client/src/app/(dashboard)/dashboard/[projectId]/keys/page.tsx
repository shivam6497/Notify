"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/api";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[#525252] hover:text-white transition-colors p-1 rounded"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function DeleteKeyDialog({
  keyId,
  projectId,
  onClose,
}: {
  keyId: string;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => revokeApiKey(projectId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", projectId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* dialog */}
      <div className="relative bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Revoke API key</p>
            <p className="text-[#525252] text-xs">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-[#a3a3a3] text-xs mb-6 leading-relaxed">
          Any application using this key will immediately lose access. Make sure
          you've updated your integration before revoking.
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
            {isPending ? "Revoking..." : "Revoke key"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["apiKeys", projectId],
    queryFn: () => getApiKeys(projectId),
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => createApiKey(projectId, keyName || undefined),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setNewKey(data.key);
      setCreating(false);
      setKeyName("");
    },
  });

  return (
    <div className="flex-1 p-6 md:p-8">

      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-[#525252] text-sm mt-0.5">
            Use these keys to authenticate requests to the notify API
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-3.5 py-2 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          New key
        </button>
      </div>

      {/* new key reveal — shown after creation */}
      {newKey && (
        <div className="bg-[#141414] border border-[#22c55e]/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            <p className="text-[#22c55e] text-xs font-medium">
              Key created — copy it now, it won't be shown again
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2.5">
            <code className="flex-1 text-white text-xs font-mono truncate">
              {showNewKey ? newKey : "nk_live_••••••••••••••••••••••••••••••••"}
            </code>
            <button
              onClick={() => setShowNewKey((p) => !p)}
              className="text-[#525252] hover:text-white transition-colors p-1"
            >
              {showNewKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <CopyButton text={newKey} />
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-[#525252] hover:text-white text-xs transition-colors"
          >
            I've saved this key, dismiss
          </button>
        </div>
      )}

      {/* create form */}
      {creating && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mb-4 flex items-center gap-3">
          <Key className="w-4 h-4 text-[#525252] shrink-0" />
          <input
            autoFocus
            placeholder="Key name (optional, e.g. production)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") setCreating(false);
            }}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#525252] outline-none"
          />
          <button
            onClick={() => setCreating(false)}
            className="text-[#525252] hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => create()}
            disabled={isPending}
            className="bg-white hover:bg-zinc-100 text-black text-xs font-medium rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {/* keys list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[#141414] border border-[#262626] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : keys?.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-4">
            <Key className="w-5 h-5 text-[#525252]" />
          </div>
          <p className="text-white text-sm font-medium mb-1">No API keys yet</p>
          <p className="text-[#525252] text-xs mb-4">
            Create a key to start integrating
          </p>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create key
          </button>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          {/* table header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-[#262626]">
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">Name</p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">Last used</p>
            <p className="text-[#525252] text-[10px] font-medium uppercase tracking-widest">Actions</p>
          </div>

          {keys?.map((key, i) => (
            <div
              key={key.id}
              className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors ${
                i !== 0 ? "border-t border-[#262626]" : ""
              }`}
            >
              {/* name + prefix */}
              <div>
                <p className="text-white text-sm font-medium">
                  {key.name ?? "Unnamed key"}
                </p>
                <p className="text-[#525252] text-xs font-mono mt-0.5">
                  {key.prefix}_••••••••
                </p>
              </div>

              {/* last used */}
              <p className="text-[#525252] text-xs">
                {key.lastUsedAt
                  ? new Date(key.lastUsedAt).toLocaleDateString()
                  : "Never used"}
              </p>

              {/* actions */}
              <button
                onClick={() => setDeletingKeyId(key.id)}
                className="text-[#525252] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* security note */}
      <div className="mt-6 flex items-start gap-2.5 text-[#525252] text-xs">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          API keys are stored hashed — we can never show them again after creation.
          If you lose a key, revoke it and create a new one.
        </p>
      </div>

      {/* delete dialog */}
      {deletingKeyId && (
        <DeleteKeyDialog
          keyId={deletingKeyId}
          projectId={projectId}
          onClose={() => setDeletingKeyId(null)}
        />
      )}
    </div>
  );
}
