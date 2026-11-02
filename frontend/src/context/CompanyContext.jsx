import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shop_name: 'DP ENTERPRISES',
    app_title: 'DP ENTERPRISES – GarmentFlow',
    app_description: 'Garment Manufacturing, Bulk Order, Stitching and Business Management System',
    shop_logo: '',
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data?.map) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.map,
          shop_name: (res.data.map.shop_name && res.data.map.shop_name.trim()) || 'DP ENTERPRISES',
        }));
      }
    } catch (err) {
      console.warn('Failed to load company branding settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateCompanySettings = async (updates) => {
    const res = await api.updateSettings(updates);
    if (res.success) {
      await fetchSettings();
    }
    return res;
  };

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.uploadLogo(formData);
    if (res.success) {
      await fetchSettings();
    }
    return res;
  };

  const removeLogo = async () => {
    const res = await api.removeLogo();
    if (res.success) {
      await fetchSettings();
    }
    return res;
  };

  const company = {
    name: (settings.shop_name && settings.shop_name.trim()) || 'DP ENTERPRISES',
    appTitle: (settings.app_title && settings.app_title.trim()) || 'DP ENTERPRISES – GarmentFlow',
    description: (settings.app_description && settings.app_description.trim()) || 'Garment Manufacturing, Bulk Order, Stitching and Business Management System',
    logoUrl: settings.shop_logo || '',
    address: settings.shop_address || '',
    phone: settings.shop_phone || '',
    email: settings.shop_email || '',
    gstin: settings.shop_gstin || '',
    gstEnabled: settings.gst_enabled === 'true',
    currencySymbol: settings.currency_symbol || '₹',
    productiveHours: settings.productive_monthly_hours || '200',
    settings,
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateCompanySettings,
        uploadLogo,
        removeLogo,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    return {
      company: {
        name: 'DP ENTERPRISES',
        appTitle: 'DP ENTERPRISES – GarmentFlow',
        description: 'Garment Manufacturing, Bulk Order, Stitching and Business Management System',
        logoUrl: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        gstEnabled: false,
        currencySymbol: '₹',
        productiveHours: '200',
      },
      settings: {},
      loading: false,
      refreshSettings: () => {},
      updateCompanySettings: async () => {},
      uploadLogo: async () => {},
      removeLogo: async () => {},
    };
  }
  return context;
};
