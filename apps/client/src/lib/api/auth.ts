import { api } from "@/lib/axios";

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export async function getMe(): Promise<User> {
  const res = await api.get<{ user: User }>("/auth/me");
  return res.data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post<{ user: User }>("/auth/login", {
    email,
    password,
  });
  return res.data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const res = await api.post<{ user: User }>("/auth/register", {
    email,
    password,
    name,
  });
  return res.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export function loginWithGoogle(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
}
