import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { billingService } from "@/api/services";
import { Invoice } from "@/types";

const BillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await billingService.getInvoices();
        setInvoices(response.data.data);
      } catch (error) {
        toast.error("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-600">Manage invoices and subscriptions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">$45,231</p>
          <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">Pending Payments</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">$8,450</p>
          <p className="text-xs text-yellow-600 mt-2">5 invoices pending</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">Overdue</p>
          <p className="text-3xl font-bold text-red-600 mt-2">$2,100</p>
          <p className="text-xs text-red-600 mt-2">2 invoices overdue</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search invoices..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Invoice #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Tenant
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Due Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      Tenant {invoice.tenantId.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">${invoice.amount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:underline text-sm">
                      View
                    </button>
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

export default BillingPage;
