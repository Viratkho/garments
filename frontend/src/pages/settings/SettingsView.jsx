import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/FormControls';
import { LoadingSpinner } from '../../components/common/EmptyState';
import { Settings, Save, Store, ShieldCheck, Clock, Check } from 'lucide-react';

export const SettingsView = () => {
  const [settings, setSettings] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    shop_gstin: '',
    gst_enabled: 'false',
    default_gst_percent: '5.0',
    productive_monthly_hours: '200',
    currency_symbol: '₹',
    order_prefix: 'GF-ORD-',
    invoice_prefix: 'GF-INV-',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useNotification();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data.map) {
        setSettings(prev => ({
          ...prev,
          ...res.data.map,
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
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateSettings(settings);
      success('Shop configuration saved successfully');
    } catch (err) {
      error(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading shop configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Application & Workshop Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure business details, GST tax parameters, productive monthly labour hours and invoice templates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Workshop Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Garment Shop Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Manufacturing Business Name"
              required
              value={settings.shop_name}
              onChange={(e) => handleChange('shop_name', e.target.value)}
              placeholder="e.g. GarmentFlow Manufacturing Works"
            />
            <Input
              label="Primary Phone Contact"
              value={settings.shop_phone}
              onChange={(e) => handleChange('shop_phone', e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Contact Email"
              type="email"
              value={settings.shop_email}
              onChange={(e) => handleChange('shop_email', e.target.value)}
              placeholder="e.g. orders@garmentflow.com"
            />
            <Input
              label="Shop GSTIN (Optional)"
              value={settings.shop_gstin}
              onChange={(e) => handleChange('shop_gstin', e.target.value)}
              placeholder="e.g. 33AABCG1234F1Z8"
              helperText="Leave empty if shop operates as unregistered/composition."
            />
          </div>

          <Textarea
            label="Shop & Warehouse Address"
            rows={2}
            value={settings.shop_address}
            onChange={(e) => handleChange('shop_address', e.target.value)}
            placeholder="Plot or building address, industrial zone, city, state and PIN"
          />
        </div>

        {/* Section 2: Labour & Costing Parameters */}
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

        {/* Section 3: Tax & Invoicing Rules */}
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
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="gst_toggle" className="text-xs font-semibold text-gray-800">
              Enable GST calculations on sales invoices (Shop is GST registered)
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
            Save Application Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
