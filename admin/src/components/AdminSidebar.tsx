import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tenants",
      path: "/tenants",
      icon: Building2,
    },
    {
      label: "Billing",
      path: "/billing",
      icon: CreditCard,
    },
    {
      label: "Payments",
      path: "/payments",
      icon: DollarSign,
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      label: "Users",
      path: "/users",
      icon: Users,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-transform duration-300 ease-in-out z-30 overflow-y-auto`}
      >
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 ${
                      active ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="px-4 py-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-400 font-semibold">VERSION</p>
              <p className="text-sm text-slate-300 font-bold">1.0.0</p>
              <p className="text-xs text-slate-500 mt-1">Admin Dashboard</p>
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
