import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { LoadingSpinner, EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { Kanban, ArrowRight, CheckCircle2, AlertCircle, Clock, Truck } from 'lucide-react';

export const ProductionView = () => {
  const [stages, setStages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stageRes, orderRes] = await Promise.all([
        api.getProductionStages(),
        api.getOrders({ isArchived: 'false' }),
      ]);
      if (stageRes.success) setStages(stageRes.data);
      if (orderRes.success) setOrders(orderRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading production tracking pipeline..." />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Factory Production Pipeline</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Monitor bulk orders through all 10 standard manufacturing stages from cutting to final quality approval and dispatch.
        </p>
      </div>

      {/* 10-Stage Roadmap Preview */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between text-center">
          {stages.map((st, idx) => (
            <React.Fragment key={st.id}>
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 rounded-full bg-[#172B4D] text-white flex items-center justify-center text-[10px] font-bold">
                  {st.stageOrder}
                </div>
                <span className="text-[10px] font-bold text-gray-700 mt-1 max-w-[80px] leading-tight">
                  {st.stageName}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div className="h-0.5 flex-1 bg-gray-200 mb-4" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Orders List with Production Progress */}
      {orders.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="No Orders in Production"
          description="Create bulk orders to track factory progress across all 10 stages."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-lg border border-gray-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2563EB]">{ord.orderNumber}</span>
                  <Badge status={ord.status} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">{ord.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{ord.company?.name} • {ord.totalPieces} pieces</p>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-600">Manufacturing Status:</span>
                    <span className="font-bold text-gray-900">{ord.status}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ord.status === 'DELIVERED' || ord.status === 'COMPLETED'
                          ? 'bg-emerald-500 w-full'
                          : ord.status === 'IN_PROGRESS'
                          ? 'bg-blue-600 w-2/3'
                          : 'bg-amber-500 w-1/4'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Target: {ord.deliveryDate ? new Date(ord.deliveryDate).toLocaleDateString() : 'N/A'}</span>
                <Link
                  to={`/orders/${ord.id}`}
                  className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Manage 10 Stages <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
