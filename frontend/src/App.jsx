import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './hooks/useAuth';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CompaniesList } from './pages/companies/CompaniesList';
import { OrdersList } from './pages/orders/OrdersList';
import { OrderDetail } from './pages/orders/OrderDetail';
import { MaterialsList } from './pages/materials/MaterialsList';
import { PurchasesList } from './pages/purchases/PurchasesList';
import { SuppliersList } from './pages/suppliers/SuppliersList';
import { WorkersList } from './pages/workers/WorkersList';
import { AttendanceView } from './pages/attendance/AttendanceView';
import { SalaryView } from './pages/salary/SalaryView';
import { ExpensesList } from './pages/expenses/ExpensesList';
import { OrderCostingView } from './pages/costing/OrderCostingView';
import { ProductionView } from './pages/production/ProductionView';
import { PaymentsList } from './pages/payments/PaymentsList';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { ProfitLossView } from './pages/profitloss/ProfitLossView';
import { ReportsView } from './pages/reports/ReportsView';
import { SettingsView } from './pages/settings/SettingsView';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected ERP Modules */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="companies" element={<CompaniesList />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="materials" element={<MaterialsList />} />
                <Route path="purchases" element={<PurchasesList />} />
                <Route path="suppliers" element={<SuppliersList />} />
                <Route path="workers" element={<WorkersList />} />
                <Route path="attendance" element={<AttendanceView />} />
                <Route path="salaries" element={<SalaryView />} />
                <Route path="expenses" element={<ExpensesList />} />
                <Route path="costing" element={<OrderCostingView />} />
                <Route path="production" element={<ProductionView />} />
                <Route path="payments" element={<PaymentsList />} />
                <Route path="invoices" element={<InvoicesList />} />
                <Route path="profit-loss" element={<ProfitLossView />} />
                <Route path="reports" element={<ReportsView />} />
                <Route path="settings" element={<SettingsView />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
