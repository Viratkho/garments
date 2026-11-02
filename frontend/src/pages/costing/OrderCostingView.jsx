import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, TrendingUp, Layers, Users, Receipt, CheckCircle2 } from 'lucide-react';

export const OrderCostingView = () => {
  const [costings, setCostings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCostings = async () => {
    try {
      setLoading(true);
      const res = await api.getOrderCostingsReport();
      if (res.success) {
        setCostings(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostings();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing order costing engine metrics across all jobs..." />;
  }

  const totalRevenue = costings.reduce((sum, c) => sum + (c.financials?.revenue || 0), 0);
  const totalCost = costings.reduce((sum, c) => sum + (c.financials?.totalOrderCost || 0), 0);
  const totalProfit = costings.reduce((sum, c) => sum + (c.financials?.netProfit || 0), 0);
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order Costing Engine</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Centralized financial calculation service displaying actual material consumption, allocated labour, overheads and net job margin.
        </p>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Contract Revenue</span>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalRevenue)}</p>
          <span className="text-xs text-gray-400">{costings.length} Orders Costed</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Manufacturing Cost</span>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalCost)}</p>
          <span className="text-xs text-gray-400">Materials, Labour & Expenses</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Realized Profit</span>
          <p className={`text-xl font-bold mt-0.5 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(totalProfit)}
          </p>
          <span className="text-xs text-gray-400">Cumulative Net Profit</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Profit Margin</span>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{avgMargin}%</p>
          <span className="text-xs text-gray-400">Across All Completed Jobs</span>
        </div>
      </div>

      {/* Costing Breakdown Cards per Order */}
      {costings.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No Orders Available for Costing"
          description="Create bulk orders and record material consumptions to see live costing."
        />
      ) : (
        <div className="space-y-4">
          {costings.map((c) => {
            const f = c.financials || {};
            const isProfit = f.netProfit >= 0;

            return (
              <div
                key={c.orderId}
                className="bg-white rounded-lg border border-gray-200 shadow-xs hover:shadow-md transition-shadow p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2563EB]">{c.orderNumber}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-semibold text-gray-600">{c.company?.name}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-0.5">{c.title}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Job Net Profit</span>
                      <span className={`text-base font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(f.netProfit)} ({f.profitMargin}%)
                      </span>
                    </div>
                    <Link
                      to={`/orders/${c.orderId}`}
                      className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-[#172B4D] hover:bg-navy-light text-white transition-colors"
                    >
                      Costing Sheet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Numerical 5-step Cost Chain */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">1. Revenue</span>
                    <span className="font-bold text-sm text-blue-600">{formatCurrency(f.revenue)}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.totalPieces} pieces</p>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">2. Raw Materials</span>
                    <span className="font-bold text-sm text-amber-700">{formatCurrency(f.actualMaterialCost)}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Weighted avg cost</p>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">3. Worker Labour</span>
                    <span className="font-bold text-sm text-blue-700">{formatCurrency(f.actualLabourCost)}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Hourly derived cost</p>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">4. Direct & Overheads</span>
                    <span className="font-bold text-sm text-purple-700">
                      {formatCurrency(f.directExpenseCost + f.allocatedOverheadCost)}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Trims, power, rent</p>
                  </div>

                  <div className={`p-2.5 rounded border ${isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <span className={`text-[10px] font-bold uppercase block ${isProfit ? 'text-emerald-800' : 'text-rose-800'}`}>
                      5. Unit Garment Cost
                    </span>
                    <span className={`font-bold text-sm ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(f.costPerGarment)}/pc
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Total: {formatCurrency(f.totalOrderCost)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
