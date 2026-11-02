import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import { useNotification } from '../../hooks/useNotification';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/FormControls';
import { LoadingSpinner } from '../../components/common/EmptyState';
import {
  Settings,
  Save,
  Store,
  ShieldCheck,
  Clock,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

export const SettingsView = () => {
  const { company, refreshSettings, uploadLogo, removeLogo } = useCompany();
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState({
    shop_name: 'DP ENTERPRISES',
    app_title: 'DP ENTERPRISES – GarmentFlow',
    app_description: 'Garment Manufacturing, Bulk Order, Stitching and Business Management System',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    shop_gstin: '',
    shop_bank_name: '',
    shop_bank_account: '',
    shop_bank_ifsc: '',
    shop_upi_id: '',
    gst_enabled: 'false',
    default_gst_percent: '5.0',
    productive_monthly_hours: '200',
    currency_symbol: '₹',
    order_prefix: 'GF-ORD-',
    invoice_prefix: 'GF-INV-',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { success, error } = useNotification();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data.map) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.map,
          shop_name: (res.data.map.shop_name && res.data.map.shop_name.trim()) || 'DP ENTERPRISES',
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      return error('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
    }

    setUploadingLogo(true);
    try {
      await uploadLogo(file);
      success('Company logo uploaded successfully! Invoices and reports will now display this logo.');
      await fetchSettings();
    } catch (err) {
      error(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove company logo and restore clean typographic DP ENTERPRISES identity?')) return;
    setUploadingLogo(true);
    try {
      await removeLogo();
      success('Logo removed. Clean typographic DP ENTERPRISES identity restored.');
      await fetchSettings();
    } catch (err) {
      error(err.message || 'Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateSettings(settings);
      await refreshSettings();
      success('DP ENTERPRISES company profile & settings saved successfully!');
    } catch (err) {
      error(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading DP ENTERPRISES configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
            Company Configuration
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Business Profile & System Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure official company branding, contact details, logo, GST tax rules, and invoice templates for DP ENTERPRISES.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Profile & Logo Branding */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">DP ENTERPRISES – Business Identity</h3>
            </div>
            <span className="text-[11px] font-medium text-gray-500">Official Brand Details</span>
          </div>

          {/* Logo Upload & Preview Card */}
          <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-lg">
            <label className="block text-xs font-bold text-gray-800 mb-2">Company Brand Logo</label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {company.logoUrl ? (
                  <div className="relative group p-2 bg-white rounded-lg border border-gray-300 shadow-xs">
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-14 max-w-[200px] object-contain"
                    />
                  </div>
                ) : (
                  /* Clean Typographic Identity Emblem */
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#172B4D] to-[#0F1B2F] rounded-lg flex items-center justify-center border border-blue-500/20 shadow-xs">
                      <span className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-white to-blue-200">
                        DP
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#172B4D]">DP ENTERPRISES</p>
                      <p className="text-[10px] text-gray-400 font-medium">Clean Typographic Identity (Active)</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-0.5">
                  <p className="font-semibold text-gray-700">
                    {company.logoUrl ? 'Custom Image Logo Active' : 'No Logo Uploaded Yet'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Displayed on Invoices, PDF Reports, Header, and Sidebar.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingLogo}
                  icon={Upload}
                >
                  {company.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {company.logoUrl && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleRemoveLogo}
                    loading={uploadingLogo}
                    icon={Trash2}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Business Name"
              required
              value={settings.shop_name}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="DP ENTERPRISES"
              helperText="Appears on all official invoices, reports, and headers."
            />
            <Input
              label="Business Subtitle / Tagline"
              value={settings.app_description}
              onChange={(e) => handleChange('app_description', e.target.value)}
              placeholder="Garment Manufacturing, Bulk Order, Stitching and Business Management System"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Telephone Number"
              value={settings.shop_phone}
              onChange={(e) => handleChange('shop_phone', e.target.value)}
              placeholder="Enter contact number (e.g. +91 98765 43210)"
              helperText="Printed on invoices only when provided."
            />
            <Input
              label="Contact Email Address"
              type="email"
              value={settings.shop_email}
              onChange={(e) => handleChange('shop_email', e.target.value)}
              placeholder="Enter email address (e.g. contact@dpenterprises.com)"
              helperText="Printed on invoices only when provided."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GST Number (Optional)"
              value={settings.shop_gstin}
              onChange={(e) => handleChange('shop_gstin', e.target.value)}
              placeholder="Enter GSTIN if registered"
              helperText="Leave blank if operating without GST registration."
            />
            <Textarea
              label="Business Address & Factory Location"
              rows={2}
              value={settings.shop_address}
              onChange={(e) => handleChange('shop_address', e.target.value)}
              placeholder="Enter official factory or shop address"
              helperText="Leave blank if not configured. Invoices will automatically omit empty address fields."
            />
          </div>
        </div>

        {/* Section 2: Banking & Payment Settlement Details for Invoices */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Banking & Settlement Details (Optional)</h3>
          </div>
          <p className="text-xs text-gray-500">
            These bank and payment details appear on customer invoices for direct client bank transfers and UPI payments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              value={settings.shop_bank_name || ''}
              onChange={(e) => handleChange('shop_bank_name', e.target.value)}
              placeholder="e.g. State Bank of India / HDFC Bank"
            />
            <Input
              label="Account Number"
              value={settings.shop_bank_account || ''}
              onChange={(e) => handleChange('shop_bank_account', e.target.value)}
              placeholder="e.g. 50200012345678"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="IFSC Code"
              value={settings.shop_bank_ifsc || ''}
              onChange={(e) => handleChange('shop_bank_ifsc', e.target.value)}
              placeholder="e.g. SBIN0001234"
            />
            <Input
              label="UPI ID / VPA"
              value={settings.shop_upi_id || ''}
              onChange={(e) => handleChange('shop_upi_id', e.target.value)}
              placeholder="e.g. dpenterprises@upi"
            />
          </div>
        </div>

        {/* Section 3: Labour & Costing Parameters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Productive Hours & Labour Costing</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Productive Monthly Working Hours"
              type="number"
              min={50}
              max={300}
              required
              value={settings.productive_monthly_hours}
              onChange={(e) => handleChange('productive_monthly_hours', e.target.value)}
              helperText="Used to derive worker hourly rates: Hourly Rate = Monthly Salary / Productive Hours (Standard: 200 hrs/month = 25 days × 8 hrs)."
            />
            <Input
              label="Currency Symbol"
              value={settings.currency_symbol}
              onChange={(e) => handleChange('currency_symbol', e.target.value)}
            />
          </div>
        </div>

        {/* Section 4: Tax & Invoicing Rules */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">GST Tax Configuration & Numbering</h3>
          </div>

          <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center gap-2">
            <input
              type="checkbox"
              id="gst_toggle"
              checked={settings.gst_enabled === 'true'}
              onChange={(e) => handleChange('gst_enabled', e.target.checked ? 'true' : 'false')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="gst_toggle" className="text-xs font-semibold text-gray-800 cursor-pointer">
              Enable GST calculations on sales invoices (DP ENTERPRISES is GST registered)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Default GST Tax %"
              type="number"
              step="0.1"
              value={settings.default_gst_percent}
              onChange={(e) => handleChange('default_gst_percent', e.target.value)}
              disabled={settings.gst_enabled !== 'true'}
            />
            <Input
              label="Order Number Prefix"
              value={settings.order_prefix}
              onChange={(e) => handleChange('order_prefix', e.target.value)}
            />
            <Input
              label="Invoice Number Prefix"
              value={settings.invoice_prefix}
              onChange={(e) => handleChange('invoice_prefix', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" loading={submitting} icon={Save}>
            Save DP ENTERPRISES Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
