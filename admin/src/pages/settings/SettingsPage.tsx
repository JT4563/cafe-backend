import React, { useState } from "react";
import { Save, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { SystemSettings } from "@/types";

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    companyName: "Cafe POS",
    supportEmail: "support@cafepos.com",
    supportPhone: "+1-800-CAFE-POS",
    timezone: "UTC",
    currency: "USD",
    maxTenants: 100,
    enableSignups: true,
    requireEmailVerification: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? inputElement.checked
          : type === "number"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Configure your admin dashboard</p>
      </div>

      {/* Company Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Company Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                name="supportPhone"
                value={settings.supportPhone || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={settings.currency || "USD"}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Company Logo
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Drag and drop your logo here or click to browse
            </p>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          System Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Timezone
            </label>
            <select
              name="timezone"
              value={settings.timezone || "UTC"}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="EST">EST</option>
              <option value="CST">CST</option>
              <option value="PST">PST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Tenants
            </label>
            <input
              type="number"
              name="maxTenants"
              value={settings.maxTenants || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="enableSignups"
              checked={settings.enableSignups || false}
              onChange={handleChange}
              className="w-4 h-4 border border-slate-300 rounded"
            />
            <span className="text-sm font-medium text-slate-700">
              Enable Signups
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="requireEmailVerification"
              checked={settings.requireEmailVerification || false}
              onChange={handleChange}
              className="w-4 h-4 border border-slate-300 rounded"
            />
            <span className="text-sm font-medium text-slate-700">
              Require Email Verification
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          <Save size={20} />
          <span>{loading ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
