import api from "./client";
import {
  AdminUser,
  AuthResponse,
  Tenant,
  Subscription,
  Invoice,
  Payment,
  DashboardStats,
  RevenueData,
  TenantMetrics,
  AdminUserFull,
  SystemSettings,
  PaginatedResponse,
  QueryParams,
} from "@/types";

// Auth Services
export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/admin/login", { email, password }),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>("/auth/refresh", { refreshToken }),

  me: () => api.get<AdminUser>("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

// Tenant Services
export const tenantService = {
  getAll: (params?: QueryParams) =>
    api.get<PaginatedResponse<Tenant>>("/tenants", { params }),

  getById: (id: string) => api.get<Tenant>(`/tenants/${id}`),

  create: (data: Partial<Tenant>) => api.post<Tenant>("/tenants", data),

  update: (id: string, data: Partial<Tenant>) =>
    api.put<Tenant>(`/tenants/${id}`, data),

  delete: (id: string) => api.delete(`/tenants/${id}`),

  getMetrics: (id: string) => api.get<TenantMetrics>(`/tenants/${id}/metrics`),

  suspendTenant: (id: string) =>
    api.patch(`/tenants/${id}/suspend`, { status: "SUSPENDED" }),

  activateTenant: (id: string) =>
    api.patch(`/tenants/${id}/activate`, { status: "ACTIVE" }),
};

// Billing Services
export const billingService = {
  getSubscriptions: (params?: QueryParams) =>
    api.get<PaginatedResponse<Subscription>>("/billing/subscriptions", {
      params,
    }),

  getSubscription: (id: string) =>
    api.get<Subscription>(`/billing/subscriptions/${id}`),

  getInvoices: (params?: QueryParams) =>
    api.get<PaginatedResponse<Invoice>>("/billing/invoices", { params }),

  getInvoice: (id: string) => api.get<Invoice>(`/billing/invoices/${id}`),

  sendInvoice: (id: string) => api.post(`/billing/invoices/${id}/send`, {}),

  cancelSubscription: (id: string) =>
    api.post(`/billing/subscriptions/${id}/cancel`, {}),
};

// Payment Services
export const paymentService = {
  getPayments: (params?: QueryParams) =>
    api.get<PaginatedResponse<Payment>>("/payments", { params }),

  getPayment: (id: string) => api.get<Payment>(`/payments/${id}`),

  refundPayment: (id: string, amount: number) =>
    api.post(`/payments/${id}/refund`, { amount }),

  retryPayment: (id: string) => api.post(`/payments/${id}/retry`, {}),

  getPaymentStats: () => api.get("/payments/stats"),
};

// Analytics Services
export const analyticsService = {
  getDashboardStats: () =>
    api.get<DashboardStats>("/analytics/dashboard-stats"),

  getRevenueData: (period: "week" | "month" | "year") =>
    api.get<RevenueData[]>("/analytics/revenue", { params: { period } }),

  getTopTenants: (limit: number = 10) =>
    api.get<TenantMetrics[]>("/analytics/top-tenants", { params: { limit } }),

  getGrowthMetrics: () => api.get("/analytics/growth"),

  getChartData: (type: string, period: string) =>
    api.get(`/analytics/chart/${type}`, { params: { period } }),
};

// User Services
export const userService = {
  getAdmins: (params?: QueryParams) =>
    api.get<PaginatedResponse<AdminUserFull>>("/admin/users", { params }),

  getAdmin: (id: string) => api.get<AdminUserFull>(`/admin/users/${id}`),

  createAdmin: (data: Partial<AdminUserFull>) =>
    api.post<AdminUserFull>("/admin/users", data),

  updateAdmin: (id: string, data: Partial<AdminUserFull>) =>
    api.put<AdminUserFull>(`/admin/users/${id}`, data),

  deleteAdmin: (id: string) => api.delete(`/admin/users/${id}`),

  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
};

// Settings Services
export const settingsService = {
  getSettings: () => api.get<SystemSettings>("/settings"),

  updateSettings: (data: Partial<SystemSettings>) =>
    api.put<SystemSettings>("/settings", data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/settings/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
