import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// User state interface
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  balance?: number;
}

// UI state interface
interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  notifications: Notification[];
  loading: Record<string, boolean>;
}

// Notification interface
interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Cache interface for API data
interface CacheState {
  tickets: Record<string, unknown>;
  users: Record<string, unknown>;
  transactions: Record<string, unknown>;
  lastFetch: Record<string, number>;
}

// Combined app state
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // UI state
  ui: UIState;

  // Cache state
  cache: CacheState;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  setLoading: (key: string, loading: boolean) => void;

  // Cache actions
  setCacheData: (key: string, data: unknown) => void;
  getCacheData: (key: string, maxAge?: number) => unknown | null;
  clearCache: (key?: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,

        ui: {
          sidebarOpen: false,
          theme: "system",
          notifications: [],
          loading: {},
        },

        cache: {
          tickets: {},
          users: {},
          transactions: {},
          lastFetch: {},
        },

        // User actions
        setUser: (user) =>
          set(
            () => ({
              user,
              isAuthenticated: !!user,
            }),
            false,
            "setUser",
          ),

        logout: () =>
          set(
            () => ({
              user: null,
              isAuthenticated: false,
              cache: {
                tickets: {},
                users: {},
                transactions: {},
                lastFetch: {},
              },
            }),
            false,
            "logout",
          ),

        // UI actions
        setSidebarOpen: (open) =>
          set(
            (state) => ({
              ui: { ...state.ui, sidebarOpen: open },
            }),
            false,
            "setSidebarOpen",
          ),

        setTheme: (theme) =>
          set(
            (state) => ({
              ui: { ...state.ui, theme },
            }),
            false,
            "setTheme",
          ),

        addNotification: (notification) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: [
                  {
                    ...notification,
                    id: Math.random().toString(36).substring(2, 11),
                    timestamp: Date.now(),
                    read: false,
                  },
                  ...state.ui.notifications,
                ],
              },
            }),
            false,
            "addNotification",
          ),

        removeNotification: (id) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: state.ui.notifications.filter(
                  (n) => n.id !== id,
                ),
              },
            }),
            false,
            "removeNotification",
          ),

        markNotificationRead: (id) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: state.ui.notifications.map((n) =>
                  n.id === id ? { ...n, read: true } : n,
                ),
              },
            }),
            false,
            "markNotificationRead",
          ),

        setLoading: (key, loading) =>
          set(
            (state) => ({
              ui: {
                ...state.ui,
                loading: {
                  ...state.ui.loading,
                  [key]: loading,
                },
              },
            }),
            false,
            "setLoading",
          ),

        // Cache actions
        setCacheData: (key, data) =>
          set(
            (state) => ({
              cache: {
                ...state.cache,
                [key]: data,
                lastFetch: {
                  ...state.cache.lastFetch,
                  [key]: Date.now(),
                },
              },
            }),
            false,
            "setCacheData",
          ),

        getCacheData: (key, maxAge = 5 * 60 * 1000) => {
          const state = get();
          const lastFetch = state.cache.lastFetch[key];

          if (!lastFetch || Date.now() - lastFetch > maxAge) {
            return null;
          }

          return state.cache[key as keyof CacheState];
        },

        clearCache: (key) =>
          set(
            (state) => {
              if (key) {
                const newCache = { ...state.cache };
                delete newCache[key as keyof CacheState];
                const newLastFetch = { ...state.cache.lastFetch };
                delete newLastFetch[key];

                return {
                  cache: {
                    ...newCache,
                    lastFetch: newLastFetch,
                  },
                };
              } else {
                return {
                  cache: {
                    tickets: {},
                    users: {},
                    transactions: {},
                    lastFetch: {},
                  },
                };
              }
            },
            false,
            "clearCache",
          ),
      }),
      {
        name: "app-store",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          ui: {
            theme: state.ui.theme,
            sidebarOpen: state.ui.sidebarOpen,
          },
        }),
      },
    ),
    {
      name: "app-store",
    },
  ),
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAppStore((state) => state.isAuthenticated);
export const useUI = () => useAppStore((state) => state.ui);
export const useNotifications = () =>
  useAppStore((state) => state.ui.notifications);
export const useLoading = (key: string) =>
  useAppStore((state) => state.ui.loading[key] || false);
export const useTheme = () => useAppStore((state) => state.ui.theme);
