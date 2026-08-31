import { api } from "@/lib/axios";

export interface Project {
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

export interface ApiKey {
  id: string;
  prefix: string;
  name: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export async function getProjects(): Promise<Project[]> {
  const res = await api.get<{ projects: Project[] }>("/projects");
  return res.data.projects;
}

export async function getProject(projectId: string): Promise<Project> {
  const res = await api.get<{ project: Project }>(`/projects/${projectId}`);
  return res.data.project;
}

export async function createProject(name: string): Promise<Project> {
  const res = await api.post<{ project: Project }>(`/projects`, { name });
  return res.data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

export async function getApiKeys(projectId: string): Promise<ApiKey[]> {
  const res = await api.get<{ keys: ApiKey[] }>(`/projects/${projectId}/keys`);
  return res.data.keys;
}

export async function createApiKey(
  projectId: string,
  name?: string,
): Promise<{ key: string; prefix: string }> {
  const res = await api.post<{ key: string; prefix: string; message: string }>(
    `/projects/${projectId}/keys`,
    { name },
  );
  return res.data;
}

export async function revokeApiKey(
  projectId: string,
  keyId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/keys/${keyId}`);
}
