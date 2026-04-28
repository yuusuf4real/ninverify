/**
 * Admin Panel State Management
 *
 * Centralized state management for admin dashboard operations.
 * Handles authentication, data fetching, and admin-specific state.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "support";
  name: string;
}

export interface DashboardMetrics {
  totalVerifications: number;
  todayVerifications: number;
  totalRevenue: number;
  todayRevenue: number;
  successRate: number;
  activeUsers: number;
  pendingVerifications: number;
  failedVerifications: number;
}

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  createdAt: string;
  lastVerification?: string;
  totalVerifications: number;
  totalSpent: number;
  status: "active" | "suspended" | "banned";
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentReference: string;
  dataLayer: string;
  createdAt: string;
  completedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  unreadMessages: number;
}

export interface Session {
  id: string;
  userId: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface AdminState {
  // Authentication
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Dashboard
  metrics: DashboardMetrics | null;
  metricsLoading: boolean;

  // Users
  users: User[];
  usersLoading: boolean;
  selectedUser: User | null;

  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;

  // Support
  tickets: SupportTicket[];
  ticketsLoading: boolean;
  selectedTicket: SupportTicket | null;

  // Sessions
  sessions: Session[];
  sessionsLoading: boolean;

  // Filters
  dateRange: { from: Date; to: Date } | null;
  searchQuery: string;

  // Actions - Authentication
  setAdmin: (admin: AdminUser | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;

  // Actions - Dashboard
  setMetrics: (metrics: DashboardMetrics) => void;
  setMetricsLoading: (loading: boolean) => void;

  // Actions - Users
  setUsers: (users: User[]) => void;
  setUsersLoading: (loading: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;

  // Actions - Transactions
  setTransactions: (transactions: Transaction[]) => void;
  setTransactionsLoading: (loading: boolean) => void;
  updateTransaction: (
    transactionId: string,
    updates: Partial<Transaction>,
  ) => void;

  // Actions - Support
  setTickets: (tickets: SupportTicket[]) => void;
  setTicketsLoading: (loading: boolean) => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  updateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;

  // Actions - Sessions
  setSessions: (sessions: Session[]) => void;
  setSessionsLoading: (loading: boolean) => void;

  // Actions - Filters
  setDateRange: (range: { from: Date; to: Date } | null) => void;
  setSearchQuery: (query: string) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  admin: null,
  isAuthenticated: false,
  isLoading: false,
  metrics: null,
  metricsLoading: false,
  users: [],
  usersLoading: false,
  selectedUser: null,
  transactions: [],
  transactionsLoading: false,
  tickets: [],
  ticketsLoading: false,
  selectedTicket: null,
  sessions: [],
  sessionsLoading: false,
  dateRange: null,
  searchQuery: "",
};

// ============================================================================
// Store
// ============================================================================

export const useAdminStore = create<AdminState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Authentication
      setAdmin: (admin) =>
        set({ admin, isAuthenticated: !!admin }, false, "setAdmin"),
      setAuthenticated: (authenticated) =>
        set({ isAuthenticated: authenticated }, false, "setAuthenticated"),
      logout: () =>
        set({ admin: null, isAuthenticated: false }, false, "logout"),

      // Dashboard
      setMetrics: (metrics) => set({ metrics }, false, "setMetrics"),
      setMetricsLoading: (loading) =>
        set({ metricsLoading: loading }, false, "setMetricsLoading"),

      // Users
      setUsers: (users) => set({ users }, false, "setUsers"),
      setUsersLoading: (loading) =>
        set({ usersLoading: loading }, false, "setUsersLoading"),
      setSelectedUser: (user) =>
        set({ selectedUser: user }, false, "setSelectedUser"),
      updateUser: (userId, updates) =>
        set(
          (state) => ({
            users: state.users.map((user) =>
              user.id === userId ? { ...user, ...updates } : user,
            ),
            selectedUser:
              state.selectedUser?.id === userId
                ? { ...state.selectedUser, ...updates }
                : state.selectedUser,
          }),
          false,
          "updateUser",
        ),

      // Transactions
      setTransactions: (transactions) =>
        set({ transactions }, false, "setTransactions"),
      setTransactionsLoading: (loading) =>
        set({ transactionsLoading: loading }, false, "setTransactionsLoading"),
      updateTransaction: (transactionId, updates) =>
        set(
          (state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === transactionId
                ? { ...transaction, ...updates }
                : transaction,
            ),
          }),
          false,
          "updateTransaction",
        ),

      // Support
      setTickets: (tickets) => set({ tickets }, false, "setTickets"),
      setTicketsLoading: (loading) =>
        set({ ticketsLoading: loading }, false, "setTicketsLoading"),
      setSelectedTicket: (ticket) =>
        set({ selectedTicket: ticket }, false, "setSelectedTicket"),
      updateTicket: (ticketId, updates) =>
        set(
          (state) => ({
            tickets: state.tickets.map((ticket) =>
              ticket.id === ticketId ? { ...ticket, ...updates } : ticket,
            ),
            selectedTicket:
              state.selectedTicket?.id === ticketId
                ? { ...state.selectedTicket, ...updates }
                : state.selectedTicket,
          }),
          false,
          "updateTicket",
        ),

      // Sessions
      setSessions: (sessions) => set({ sessions }, false, "setSessions"),
      setSessionsLoading: (loading) =>
        set({ sessionsLoading: loading }, false, "setSessionsLoading"),

      // Filters
      setDateRange: (range) => set({ dateRange: range }, false, "setDateRange"),
      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, "setSearchQuery"),

      // Reset
      reset: () => set(initialState, false, "reset"),
    }),
    {
      name: "AdminStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

export const useAdmin = () => useAdminStore((state) => state.admin);
export const useIsAuthenticated = () =>
  useAdminStore((state) => state.isAuthenticated);
export const useMetrics = () => useAdminStore((state) => state.metrics);
export const useUsers = () => useAdminStore((state) => state.users);
export const useTransactions = () =>
  useAdminStore((state) => state.transactions);
export const useTickets = () => useAdminStore((state) => state.tickets);
export const useSessions = () => useAdminStore((state) => state.sessions);
