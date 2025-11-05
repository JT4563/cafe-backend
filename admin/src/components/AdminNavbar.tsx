import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, User, Bell } from "lucide-react";
import { useAuthStore } from "@/store";

const AdminNavbar: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate("/admin-login");
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cafe Admin</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>

          {/* Center - Breadcrumb */}
          <div className="hidden md:block text-sm text-slate-400">
            {location.pathname === "/" || location.pathname === "/dashboard"
              ? "Dashboard"
              : location.pathname.replace("/", "").charAt(0).toUpperCase() +
                location.pathname.replace("/", "").slice(1)}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              {/* Dropdown Menu */}
              <div className="relative group">
                <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200">
                  <Settings size={20} />
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 first:rounded-t-lg"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 last:rounded-b-lg"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
