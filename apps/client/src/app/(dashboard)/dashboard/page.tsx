"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, createProject } from "@/lib/api/index";
import { Plus, ArrowRight, Layers } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => createProject(name),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCreating(false);
      setName("");
      router.push(`/dashboard/${project.id}`);
    },
  });

  return (
    <div className="flex-1 p-6 md:p-8">

      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">Projects</h1>
          <p className="text-[#525252] text-sm mt-0.5">
            Each project gets its own API key and subscribers
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-3.5 py-2 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          New project
        </button>
      </div>

      {/* create project inline form */}
      {creating && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mb-4 flex items-center gap-3">
          <input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) mutate();
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
            onClick={() => name.trim() && mutate()}
            disabled={isPending || !name.trim()}
            className="bg-white hover:bg-zinc-100 text-black text-xs font-medium rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {/* projects list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-[#141414] border border-[#262626] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        // empty state
        <div className="border border-dashed border-[#262626] rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-4">
            <Layers className="w-5 h-5 text-[#525252]" />
          </div>
          <p className="text-white text-sm font-medium mb-1">No projects yet</p>
          <p className="text-[#525252] text-xs mb-4">
            Create a project to get your API key
          </p>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create project
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects?.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/dashboard/${project.id}`)}
              className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] rounded-xl p-4 flex items-center justify-between group transition-all duration-150 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-medium">
                    {project.name[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{project.name}</p>
                  <p className="text-[#525252] text-xs mt-0.5">
                    {project._count.subscribers} subscribers · {project._count.notifications} notifications
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#525252] transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}