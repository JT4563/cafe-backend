import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuthStore } from "@/store";

// Admin Pages
import AdminLoginPage from "@/pages/AdminLoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import TenantsPage from "@/pages/tenants/TenantsPage";
import BillingPage from "@/pages/billing/BillingPage";
import PaymentsPage from "@/pages/payments/PaymentsPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import UsersPage from "@/pages/users/UsersPage";
import SettingsPage from "@/pages/settings/SettingsPage";

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Admin Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <AdminProtectedRoute>
              <DashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/tenants"
          element={
            <AdminProtectedRoute>
              <TenantsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <AdminProtectedRoute>
              <BillingPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <AdminProtectedRoute>
              <PaymentsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AdminProtectedRoute>
              <AnalyticsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminProtectedRoute>
              <UsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminProtectedRoute>
              <SettingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
