// Authentication Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  subscriptionPlan: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  monthlyRevenue: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  logoUrl?: string;
}

// Billing Types
export interface Subscription {
  id: string;
  tenantId: string;
  plan: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE";
  monthlyPrice: number;
  billingCycle: "MONTHLY" | "YEARLY";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED";
  dueDate: string;
  paidDate?: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod: "CARD" | "BANK_TRANSFER" | "PAYPAL";
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Analytics Types
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  monthlyRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  conversionRate: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TenantMetrics {
  tenantId: string;
  name: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  growthRate: number;
}

// User Types
export interface AdminUserFull extends AdminUser {
  permissions: string[];
  lastLogin?: string;
  isActive: boolean;
}

// Settings Types
export interface SystemSettings {
  id: string;
  companyName: string;
  supportEmail: string;
  supportPhone?: string;
  logoUrl?: string;
  websiteUrl?: string;
  timezone: string;
  currency: string;
  maxTenants: number;
  enableSignups: boolean;
  requireEmailVerification: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
