import React, { useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import { Payment } from "@/types";

const PaymentsPage: React.FC = () => {
  const [payments] = useState<Payment[]>([]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      COMPLETED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600">Transaction history and management</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Payments", value: "$125,450", trend: "+15%" },
          { label: "Today", value: "$3,250", trend: "+5%" },
          { label: "This Month", value: "$45,120", trend: "+22%" },
          { label: "Success Rate", value: "99.8%", trend: "+0.2%" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          >
            <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {stat.value}
            </p>
            <p className="text-xs text-green-600 mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex gap-4">
          <input
            type="text"
            placeholder="Search payments..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
          />
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <Filter size={20} />
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Transaction ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Tenant
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Method
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No payments recorded
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm">
                    {payment.transactionId}
                  </td>
                  <td className="px-6 py-4">Tenant</td>
                  <td className="px-6 py-4 font-bold">${payment.amount}</td>
                  <td className="px-6 py-4 text-sm">{payment.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
