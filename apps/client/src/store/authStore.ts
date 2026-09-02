
import { create } from "zustand";

// ============================================================================
// Client Authentication Store (Zustand)
// Manages authenticated user session state, loading indicators, and logout resets.
// ============================================================================

interface User {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // Defaults to true until AuthInitializer finishes checking session
    isAuthenticated: false,

    setUser: (user) => 
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    }),
}));