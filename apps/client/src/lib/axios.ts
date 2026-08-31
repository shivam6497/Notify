import axios from "axios";

// ============================================================================
// Axios HTTP Client
// Preconfigured instance with cookie support and automatic 401 token refresh.
// ============================================================================

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true,
  timeout: 15000, // 15s timeout — prevents requests from hanging indefinitely
});

// ─── Refresh Mutex ───────────────────────────────────────────
// Only ONE refresh call can be in-flight at a time.
// Any other request that gets a 401 while a refresh is already in progress
// will queue up and wait for that refresh to finish, then retry with the
// new credentials — rather than each firing its own redundant refresh call.

let isRefreshing = false;
let waitQueue: Array<(success: boolean) => void> = [];

function onRefreshDone(success: boolean) {
  waitQueue.forEach((resolve) => resolve(success));
  waitQueue = [];
}

// ─── Response Interceptor ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only handle 401s, and never retry the same request twice
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Never attempt to refresh if:
    // a) The request IS /auth/refresh (prevents infinite loop)
    // b) The request IS /auth/me (AuthInitializer handles its own refresh logic;
    //    if we let the interceptor refresh here, it can trigger window.location
    //    redirects on the login page itself, causing an infinite reload loop)
    if (
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    // If a refresh is already underway, queue this request until it finishes
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push((success) => {
          if (success) resolve(api(original));
          else reject(error);
        });
      });
    }

    // Become the single refresh caller
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      isRefreshing = false;
      onRefreshDone(true);       // wake up all queued requests — retry them
      return api(original);       // retry the request that triggered the refresh
    } catch {
      isRefreshing = false;
      onRefreshDone(false); // tell queued requests to give up
      // Only redirect if not already on the login page — redirecting while
      // already on /login causes an infinite page-reload loop
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  },
);
