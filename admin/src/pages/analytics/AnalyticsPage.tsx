import React from "react";
import { TrendingUp, BarChart3 } from "lucide-react";

const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">System-wide analytics and insights</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: "$450,230", icon: "💰" },
          { label: "Growth Rate", value: "23.5%", icon: "📈" },
          { label: "Active Users", value: "1,245", icon: "👥" },
          { label: "Conversion Rate", value: "8.2%", icon: "🎯" },
        ].map((metric, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          >
            <div className="text-3xl mb-2">{metric.icon}</div>
            <p className="text-slate-600 text-sm font-medium">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Revenue Trend</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
            Chart Placeholder
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-slate-900">User Growth</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
            Chart Placeholder
          </div>
        </div>
      </div>

      {/* Top Tenants */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">
          Top Performing Tenants
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg"></div>
                <div>
                  <p className="font-medium text-slate-900">Cafe #{i}</p>
                  <p className="text-xs text-slate-500">
                    {(Math.random() * 100) | 0} orders this month
                  </p>
                </div>
              </div>
              <span className="font-bold text-slate-900">
                ${((Math.random() * 50000) | 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
