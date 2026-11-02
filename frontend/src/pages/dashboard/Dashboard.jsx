import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  Receipt,
  CreditCard,
  Layers,
  Users,
  AlertTriangle,
  ArrowRight,
  Truck,
  PlusCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return <LoadingSpinner text="Fetching live factory metrics from MySQL..." />;
  }

  const { kpis, charts, recentOrders, upcomingDeliveries, recentExpenses, lowStockAlerts } = data;

  const PIE_COLORS = ['#F59E0B', '#2563EB', '#16A34A', '#0F1B2F', '#DC2626'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Factory Operations & Business Financials</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time metrics calculated from active shop records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-md bg-[#2563EB] text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            New Bulk Order
          </Link>
          <Link
            to="/costing"
            className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Costing Engine
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (9 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard
          title="Total Orders"
          value={kpis.totalOrders}
          subtitle={`${kpis.activeOrders} active in production`}
          icon={Package}
          color="navy"
        />
        <StatCard
          title="Active Orders"
          value={kpis.activeOrders}
          subtitle="Pending cutting or stitching"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Completed Orders"
          value={kpis.completedOrders}
          subtitle="Finished or dispatched"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          subtitle="Gross order quotation value"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          subtitle="Materials, salaries & utilities"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(kpis.netProfit)}
          subtitle={kpis.netProfit >= 0 ? 'Operating with positive margin' : 'Operating deficit'}
          icon={TrendingUp}
          color={kpis.netProfit >= 0 ? 'green' : 'rose'}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(kpis.pendingPayments)}
          subtitle="Receivables owed by clients"
          icon={CreditCard}
          color="rose"
        />
        <StatCard
          title="Raw Stock Valuation"
          value={formatCurrency(kpis.materialStockValue)}
          subtitle="Fabrics & trims in inventory"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Monthly Salaries"
          value={formatCurrency(kpis.monthlySalaryExpenses)}
          subtitle="Disbursed to workers this month"
          icon={Users}
          color="blue"
        />
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Low Material Stock Warning ({lowStockAlerts.length} items below minimum threshold)
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {lowStockAlerts.map(m => (
                <span key={m.id} className="text-xs bg-white/80 border border-amber-300 text-amber-900 px-2 py-0.5 rounded font-medium">
                  {m.name}: <strong className="text-red-600">{m.currentStock} {m.unit}</strong> remaining (Min: {m.minStockLevel})
                </span>
              ))}
            </div>
          </div>
          <Link to="/materials" className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 flex-shrink-0">
            View Inventory
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expenses (2 cols) */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Monthly Revenue vs Expenses</h3>
              <p className="text-xs text-gray-500">6-Month financial performance overview</p>
            </div>
            <span className="text-xs font-medium text-gray-400">Values in INR (₹)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#172B4D', borderColor: '#172B4D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution (1 col) */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">Order Status Breakdown</h3>
            <p className="text-xs text-gray-500">Distribution of active and finished jobs</p>
          </div>
          <div className="h-64 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={charts.orderStatusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {charts.orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} orders`, name]}
                  contentStyle={{ backgroundColor: '#172B4D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 text-xs mt-1">
              {charts.orderStatusDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{entry.name}: <strong className="text-gray-900">{entry.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid: Recent Orders and Deliveries / Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bulk Orders */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Bulk Orders</h3>
            <Link to="/orders" className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center">
              All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {recentOrders && recentOrders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Order #</th>
                    <th className="py-2.5 px-4">Company</th>
                    <th className="py-2.5 px-4">Pieces</th>
                    <th className="py-2.5 px-4">Revenue</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#2563EB]">
                        <Link to={`/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{order.company?.name || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{order.totalPieces} pcs</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(order.totalRevenue)}</td>
                      <td className="py-3 px-4">
                        <Badge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">No orders registered yet.</div>
            )}
          </div>
        </div>

        {/* Upcoming Deliveries & Recent Expenses */}
        <div className="space-y-6">
          {/* Upcoming Deliveries */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-blue-600" />
                Upcoming Deliveries
              </h3>
              <span className="text-xs text-gray-400">Target dispatch dates</span>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingDeliveries && upcomingDeliveries.length > 0 ? (
                upcomingDeliveries.map(d => (
                  <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{d.orderNumber} – {d.title}</p>
                      <p className="text-[11px] text-gray-500">{d.company?.name} • {d.totalPieces} pcs</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Due: {formatDate(d.deliveryDate)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">No upcoming deliveries scheduled.</div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center">
                <Receipt className="w-4 h-4 mr-2 text-amber-600" />
                Recent Business Expenses
              </h3>
              <Link to="/expenses" className="text-xs font-semibold text-[#2563EB] hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentExpenses && recentExpenses.length > 0 ? (
                recentExpenses.map(e => (
                  <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{e.description || e.category?.name}</p>
                      <p className="text-[11px] text-gray-400">{e.category?.name} • {formatDate(e.expenseDate)}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatCurrency(e.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">No expenses recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
