"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/index";
import { getMe } from "@/lib/api";
import { api } from "@/lib/axios";

// ============================================================================
// AuthInitializer
// Runs once on app mount. Checks whether the user has a valid session by
// calling GET /auth/me. If the access token is expired (401), it silently
// attempts to refresh the token and retries. Only marks the user as logged out
// if the refresh itself also fails (genuinely no session).
//
// NOTE: We explicitly DO NOT skip /auth/me here — the axios interceptor
// is configured NOT to retry /auth/me, so if the access token is expired
// when getMe() fires, the interceptor will NOT trigger an auto-refresh.
// This prevents the interceptor from redirecting to /login while on the
// login page itself, avoiding the infinite reload loop.
// ============================================================================

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        // Happy path: valid access token
        const user = await getMe();
        setUser(user);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          // Access token expired — try a silent refresh, then retry getMe
          try {
            await api.post("/auth/refresh");
            const user = await getMe();
            setUser(user);
          } catch {
            // Refresh token also expired — genuine session end
            setUser(null);
          }
        } else {
          // Network error or other non-auth failure
          setUser(null);
        }
      }
    }

    init();
  }, []);

  return <>{children}</>;
}
