/**
 * UI State Management
 *
 * Global UI state management for modals, toasts, loading states, etc.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  onClose?: () => void;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface UIState {
  // Toasts
  toasts: Toast[];

  // Modals
  modals: Modal[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Sidebar (for admin)
  sidebarOpen: boolean;

  // Mobile menu
  mobileMenuOpen: boolean;

  // Theme
  theme: "light" | "dark" | "system";

  // Actions - Toasts
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Actions - Modals
  openModal: (modal: Omit<Modal, "id">) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions - Mobile Menu
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Actions - Theme
  setTheme: (theme: "light" | "dark" | "system") => void;
}

// ============================================================================
// Store
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      toasts: [],
      modals: [],
      globalLoading: false,
      loadingMessage: null,
      sidebarOpen: true,
      mobileMenuOpen: false,
      theme: "system",

      // Toasts
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };

        set(
          (state) => ({ toasts: [...state.toasts, newToast] }),
          false,
          "addToast",
        );

        // Auto-remove after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            set(
              (state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
              }),
              false,
              "removeToast",
            );
          }, toast.duration || 5000);
        }
      },

      removeToast: (id) =>
        set(
          (state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }),
          false,
          "removeToast",
        ),

      clearToasts: () => set({ toasts: [] }, false, "clearToasts"),

      // Modals
      openModal: (modal) => {
        const id = Math.random().toString(36).substring(7);
        const newModal = { ...modal, id };

        set(
          (state) => ({ modals: [...state.modals, newModal] }),
          false,
          "openModal",
        );
      },

      closeModal: (id) =>
        set(
          (state) => {
            const modal = state.modals.find((m) => m.id === id);
            if (modal?.onClose) {
              modal.onClose();
            }
            return {
              modals: state.modals.filter((m) => m.id !== id),
            };
          },
          false,
          "closeModal",
        ),

      closeAllModals: () =>
        set(
          (state) => {
            state.modals.forEach((modal) => {
              if (modal.onClose) {
                modal.onClose();
              }
            });
            return { modals: [] };
          },
          false,
          "closeAllModals",
        ),

      // Loading
      setGlobalLoading: (loading, message) =>
        set(
          { globalLoading: loading, loadingMessage: message || null },
          false,
          "setGlobalLoading",
        ),

      // Sidebar
      toggleSidebar: () =>
        set(
          (state) => ({ sidebarOpen: !state.sidebarOpen }),
          false,
          "toggleSidebar",
        ),

      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }, false, "setSidebarOpen"),

      // Mobile Menu
      toggleMobileMenu: () =>
        set(
          (state) => ({ mobileMenuOpen: !state.mobileMenuOpen }),
          false,
          "toggleMobileMenu",
        ),

      setMobileMenuOpen: (open) =>
        set({ mobileMenuOpen: open }, false, "setMobileMenuOpen"),

      // Theme
      setTheme: (theme) => {
        set({ theme }, false, "setTheme");

        // Apply theme to document
        if (typeof window !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else if (theme === "light") {
            document.documentElement.classList.remove("dark");
          } else {
            // System preference
            const isDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            if (isDark) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
        }
      },
    }),
    {
      name: "UIStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

export const useToasts = () => useUIStore((state) => state.toasts);
export const useModals = () => useUIStore((state) => state.modals);
export const useGlobalLoading = () =>
  useUIStore((state) => state.globalLoading);
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useTheme = () => useUIStore((state) => state.theme);

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook for showing toasts
 */
export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string, duration?: number) =>
      addToast({ type: "success", message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: "error", message, duration }),
    warning: (message: string, duration?: number) =>
      addToast({ type: "warning", message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: "info", message, duration }),
  };
}

/**
 * Hook for managing modals
 */
export function useModal() {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const closeAllModals = useUIStore((state) => state.closeAllModals);

  return {
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
  };
}
