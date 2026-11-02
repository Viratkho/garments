import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/common/EmptyState';
import { TrendingUp, Calendar, DollarSign, Receipt, PieChart as PieIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const ProfitLossView = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      const res = await api.getProfitLoss({ year: selectedYear });
      if (res.success) {
        setPnlData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnL();
  }, [selectedYear]);

  if (loading || !pnlData) {
    return <LoadingSpinner text="Computing overall Profit & Loss statement..." />;
  }

  const { summary, expensesByCategory, orderCostings } = pnlData;
  const isPositive = summary.netOperatingProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Business Profit & Loss Statement</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Comprehensive annual and monthly income statement calculated from actual MySQL sales and expense ledgers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Financial Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-blue-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <option key={yr} value={yr}>FY {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Income Statement Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Order Revenue</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalRevenue)}</p>
          <span className="text-xs text-blue-600 font-medium">Billed contract revenue</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Business Outflow</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(summary.totalBusinessExpenses)}</p>
          <span className="text-xs text-gray-500">Materials, wages, overheads</span>
        </div>

        <div className={`p-4 rounded-lg border shadow-xs sm:col-span-2 ${isPositive ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isPositive ? 'text-emerald-800' : 'text-rose-800'}`}>
              Net Operating Profit (Before Tax)
            </span>
            {isPositive ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className={`text-2xl font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(summary.netOperatingProfit)}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-200/60 text-emerald-800' : 'bg-rose-200/60 text-rose-800'}`}>
              {summary.netProfitMargin}% Net Margin
            </span>
          </div>
          <p className="text-[11px] text-gray-600 mt-1">
            Total Cash Collected To Date: <strong>{formatCurrency(summary.totalCashCollected)}</strong>
          </p>
        </div>
      </div>

      {/* Expenses by Category Breakdown & Order Costing Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Expenses Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">Annual Expenditure Breakdown by Category</h3>
            <p className="text-xs text-gray-500">Consolidated operational spending</p>
          </div>
          <div className="divide-y divide-gray-100 text-xs">
            {expensesByCategory && expensesByCategory.length > 0 ? (
              expensesByCategory.map((cat, i) => {
                const pct = summary.totalBusinessExpenses > 0
                  ? ((cat.amount / summary.totalBusinessExpenses) * 100).toFixed(1)
                  : 0;
                return (
                  <div key={i} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-semibold text-gray-900">{cat.category}</div>
                      <div className="text-[11px] text-gray-400">{pct}% of total expense</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-gray-400">No expenses recorded for this period.</p>
            )}
          </div>
        </div>

        {/* Order Manufacturing Performance */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">Job-Level Profit Contribution & Labour Absorption</h3>
            <p className="text-xs text-gray-500">Aggregated order costing and labour recovery analysis</p>
          </div>
          <div className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-600 font-medium">Order Direct Material Cost:</span>
              <span className="font-bold text-amber-700">{formatCurrency(summary.totalOrderMaterialCost)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded border border-blue-200">
              <div>
                <span className="text-blue-900 font-medium">Allocated Worker Labour:</span>
                <p className="text-[10px] text-blue-600">Absorbed directly into manufacturing orders</p>
              </div>
              <span className="font-bold text-blue-700">{formatCurrency(summary.totalAllocatedLabourCost)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-600 font-medium">Actual Wages Paid (Cash Outflow):</span>
              <span className="font-bold text-gray-900">{formatCurrency(summary.totalSalaryExpenses)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded border border-amber-200">
              <div>
                <span className="text-amber-900 font-medium">Unallocated Labour Cost (Overhead):</span>
                <p className="text-[10px] text-amber-700">Wage capacity not absorbed into specific orders</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-800">{formatCurrency(summary.unallocatedLabourCost || 0)}</span>
                <span className="block text-[10px] text-gray-500 font-semibold">{summary.labourRecoveryRate || 0}% absorbed</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-emerald-900 font-semibold">Cumulative Order Manufacturing Profit:</span>
              <span className="font-bold text-sm text-emerald-700">{formatCurrency(summary.orderBasedProfit)}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded text-[11px] text-gray-500 leading-tight">
              <strong>Double-Counting Prevention:</strong> Actual wage disbursements are recorded once under business expenses in the primary P&L. Job-allocated labour distributes this capacity across customer orders for pricing accuracy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
