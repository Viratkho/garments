const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('garmentflow_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('garmentflow_token');
    localStorage.removeItem('garmentflow_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  // Handle binary downloads (e.g. PDF or Excel)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('spreadsheetml')) {
    if (!response.ok) throw new Error('File download failed');
    return response.blob();
  }

  const data = await response.json();

  if (!response.ok) {
    const message = data.message || (data.errors ? data.errors.map(e => e.message).join(', ') : 'Request failed');
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Companies
  getCompanies: (params = {}) => request(`/companies?${new URLSearchParams(params)}`),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => request(`/orders?${new URLSearchParams(params)}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (formData) => request('/orders', { method: 'POST', body: formData }),
  updateOrder: (id, formData) => request(`/orders/${id}`, { method: 'PUT', body: formData }),
  duplicateOrder: (id) => request(`/orders/${id}/duplicate`, { method: 'POST' }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Materials & Categories
  getMaterials: (params = {}) => request(`/materials?${new URLSearchParams(params)}`),
  getMaterial: (id) => request(`/materials/${id}`),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  adjustStock: (id, data) => request(`/materials/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
  getMaterialCategories: () => request('/materials/categories'),
  createMaterialCategory: (data) => request('/materials/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases
  getPurchases: (params = {}) => request(`/purchases?${new URLSearchParams(params)}`),
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (formData) => request('/purchases', { method: 'POST', body: formData }),

  // Suppliers
  getSuppliers: (params = {}) => request(`/suppliers?${new URLSearchParams(params)}`),
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Workers
  getWorkers: (params = {}) => request(`/workers?${new URLSearchParams(params)}`),
  getWorker: (id) => request(`/workers/${id}`),
  createWorker: (data) => request('/workers', { method: 'POST', body: JSON.stringify(data) }),
  updateWorker: (id, data) => request(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorker: (id) => request(`/workers/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params = {}) => request(`/attendance?${new URLSearchParams(params)}`),
  recordAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getAttendanceSummary: (params = {}) => request(`/attendance/summary?${new URLSearchParams(params)}`),

  // Salaries
  getSalaries: (params = {}) => request(`/salaries?${new URLSearchParams(params)}`),
  generateSalaries: (data) => request('/salaries/generate', { method: 'POST', body: JSON.stringify(data) }),
  recordSalaryPayment: (data) => request('/salaries/pay', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params = {}) => request(`/expenses?${new URLSearchParams(params)}`),
  getExpense: (id) => request(`/expenses/${id}`),
  createExpense: (formData) => request('/expenses', { method: 'POST', body: formData }),
  updateExpense: (id, formData) => request(`/expenses/${id}`, { method: 'PUT', body: formData }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  allocateOverhead: (id, data) => request(`/expenses/${id}/allocate`, { method: 'POST', body: JSON.stringify(data) }),
  getExpenseCategories: () => request('/expenses/categories'),
  createExpenseCategory: (data) => request('/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Costing
  getOrderCosting: (orderId) => request(`/costing/order/${orderId}`),
  recordMaterialConsumption: (orderId, data) => request(`/costing/order/${orderId}/material-consumption`, { method: 'POST', body: JSON.stringify(data) }),
  deleteMaterialConsumption: (id) => request(`/costing/material-consumption/${id}`, { method: 'DELETE' }),
  recordLabourAllocation: (orderId, data) => request(`/costing/order/${orderId}/labour-allocation`, { method: 'POST', body: JSON.stringify(data) }),
  deleteLabourAllocation: (id) => request(`/costing/labour-allocation/${id}`, { method: 'DELETE' }),

  // Production Tracking
  getProductionStages: () => request('/production/stages'),
  getOrderProduction: (orderId) => request(`/production/order/${orderId}`),
  updateStageProgress: (orderId, data) => request(`/production/order/${orderId}/update`, { method: 'POST', body: JSON.stringify(data) }),
  recordQualityCheck: (orderId, data) => request(`/production/order/${orderId}/quality`, { method: 'POST', body: JSON.stringify(data) }),
  recordDelivery: (orderId, data) => request(`/production/order/${orderId}/delivery`, { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  getPayments: (params = {}) => request(`/payments?${new URLSearchParams(params)}`),
  getPayment: (id) => request(`/payments/${id}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params = {}) => request(`/invoices?${new URLSearchParams(params)}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
  downloadInvoicePdf: (id) => request(`/invoices/${id}/pdf`),

  // Reports
  getProfitLoss: (params = {}) => request(`/reports/profit-loss?${new URLSearchParams(params)}`),
  getOrderCostingsReport: () => request('/reports/order-costings'),
  exportOrdersExcel: () => request('/reports/export/orders-excel'),
  exportInventoryExcel: () => request('/reports/export/inventory-excel'),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
