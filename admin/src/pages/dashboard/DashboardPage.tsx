import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  CreditCard,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { analyticsService } from "@/api/services";
import toast from "react-hot-toast";

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  monthlyRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  conversionRate: number;
}

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  format?: (val: number | string) => string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsService.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards: StatCard[] = [
    {
      title: "Total Tenants",
      value: stats?.totalTenants || 0,
      icon: <Users className="w-8 h-8" />,
      trend: 12,
    },
    {
      title: "Active Tenants",
      value: stats?.activeTenants || 0,
      icon: <TrendingUp className="w-8 h-8" />,
      trend: 8,
    },
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`,
      icon: <CreditCard className="w-8 h-8" />,
      trend: 25,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: <ShoppingCart className="w-8 h-8" />,
      trend: 15,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${
                  index === 0
                    ? "bg-blue-100 text-blue-600"
                    : index === 1
                    ? "bg-green-100 text-green-600"
                    : index === 2
                    ? "bg-purple-100 text-purple-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {card.icon}
              </div>
              {card.trend && (
                <div
                  className={`flex items-center space-x-1 text-sm font-semibold ${
                    card.trend > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span>{Math.abs(card.trend)}%</span>
                  {card.trend > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">
              {card.title}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
            <p className="text-sm text-slate-600">Last 30 days</p>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-400">Chart placeholder</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <p className="text-slate-600 text-sm font-medium mb-2">
              Avg. Order Value
            </p>
            <p className="text-2xl font-bold text-slate-900">
              ${stats?.averageOrderValue?.toFixed(2) || 0}
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 5% from last week</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <p className="text-slate-600 text-sm font-medium mb-2">
              Growth Rate
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.growthRate?.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 3% from last month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <p className="text-slate-600 text-sm font-medium mb-2">
              Conversion Rate
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {stats?.conversionRate?.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 2% from last month</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    New order from Cafe {i}
                  </p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                +$125.00
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
