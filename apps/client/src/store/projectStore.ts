import { create } from "zustand";

interface Project {
  id: string;
  name: string;
  webhookSecret: string;
  createdAt: string;
  _count: {
    subscribers: number;
    notifications: number;
    apiKeys: number;
  };
}

interface ProjectState {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}));