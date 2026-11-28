"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { computeDashboardSummary } from "@/lib/calculations";
import { formatCurrency, formatDate, formatNumber, toISODate } from "@/lib/format";
import {
  InteractiveAreaChart,
  InteractiveBarChart,
  InteractiveDonutChart,
} from "@/components/charts/GarmentCharts";
import { AnimatedNumber, GlassCard, StatusBadge } from "@/components/ui/GlassPrimitives";

export function DashboardModule() {
  const { state, setActiveModule, setEditingOrderId } = useGarmentFlow();
  const { currency, animateNumbers } = state.settings;
  const todayISO = toISODate(new Date());

  const summary = useMemo(
    () => computeDashboardSummary(state, todayISO),
    [state, todayISO]
  );

  const profitPositive = summary.monthlyProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Strip (4 Primary Pillars) */}
      <section aria-label="Primary operational metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5 hover:border-[var(--violet-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Monthly Revenue
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--violet-soft)] text-[#8B5CF6]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            <AnimatedNumber
              value={summary.monthlyRevenue}
              formatter={(v) => formatCurrency(v, currency)}
              animate={animateNumbers}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Realized from completed orders this month
          </p>
        </GlassCard>

        <GlassCard className="p-5 hover:border-[var(--violet-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Monthly Expenses
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--rosso-soft)] text-[#D50000]">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            <AnimatedNumber
              value={summary.monthlyExpenses}
              formatter={(v) => formatCurrency(v, currency)}
              animate={animateNumbers}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)] tabular-nums">
            Order costs {formatCurrency(summary.monthlyOrderCosts, currency)} + Overheads{" "}
            {formatCurrency(summary.monthlyGeneralExpenses, currency)}
          </p>
        </GlassCard>

        <GlassCard className="p-5 hover:border-[var(--violet-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Monthly Profit / Loss
            </span>
            <StatusBadge
              label={profitPositive ? "Net Profit" : "Net Loss"}
              tone={profitPositive ? "positive" : "rosso"}
            />
          </div>
          <div
            className={`mt-3 text-2xl font-extrabold tracking-tight ${
              profitPositive ? "text-[var(--positive)]" : "text-[#D50000]"
            }`}
          >
            <AnimatedNumber
              value={summary.monthlyProfitLoss}
              formatter={(v) => formatCurrency(v, currency)}
              animate={animateNumbers}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Revenue minus order costs & general expenses
          </p>
        </GlassCard>

        <GlassCard className="p-5 hover:border-[var(--violet-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Total Orders
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingOrderId(null);
                setActiveModule("new-order");
              }}
              className="gf-btn-primary inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            <AnimatedNumber
              value={summary.totalOrders}
              formatter={formatNumber}
              animate={animateNumbers}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
            <span>{summary.completedOrders} Completed</span>
            <span>·</span>
            <span>{summary.inProgressOrders} In Progress</span>
            <span>·</span>
            <span>{summary.pendingOrders} Pending</span>
          </div>
        </GlassCard>
      </section>

      {/* Secondary Compact Operational Bar covering remaining 7 dynamic summary cards */}
      <section aria-label="Operational status counters" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <GlassCard className="p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--positive)]" />
            <span>Completed</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.completedOrders}
          </p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Clock className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>In Progress</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.inProgressOrders}
          </p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <ClipboardList className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>Pending</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.pendingOrders}
          </p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Boxes className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>Materials</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.totalInventoryMaterials}
          </p>
        </GlassCard>

        <GlassCard
          className={`p-3.5 ${
            summary.lowStockCount > 0 ? "border-[var(--rosso-border)]" : ""
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                summary.lowStockCount > 0 ? "text-[#D50000]" : "text-[var(--text-muted)]"
              }`}
            />
            <span>Low Stock Alerts</span>
          </div>
          <p
            className={`mt-1.5 text-lg font-extrabold tabular-nums ${
              summary.lowStockCount > 0 ? "text-[#D50000]" : "text-[var(--text-primary)]"
            }`}
          >
            {summary.lowStockCount}
          </p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Users className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>Total Workers</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.totalWorkers}
          </p>
        </GlassCard>

        <GlassCard className="col-span-2 p-3.5 sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <CalendarCheck2 className="h-3.5 w-3.5 text-[var(--positive)]" />
            <span>Today&apos;s Attendance</span>
          </div>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {summary.presentToday + summary.halfDayToday}/{summary.totalWorkers}{" "}
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              ({summary.todayAttendanceRate}%)
            </span>
          </p>
        </GlassCard>
      </section>

      {/* Main Analytics Row: Revenue Overview & Monthly Business Performance */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="p-5 xl:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Monthly Business Performance
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Realized revenue compared against order costs and general expenses
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("earnings")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              Earnings Detail <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <InteractiveBarChart
            data={summary.monthlySeries.map((m) => ({
              label: m.label,
              primary: m.revenue,
              secondary: m.totalOutflow,
            }))}
            primaryLabel="Completed Revenue"
            secondaryLabel="Costs & Expenses"
            primaryColor="#8B5CF6"
            secondaryColor="#D50000"
            currency={currency}
          />
        </GlassCard>

        <GlassCard className="p-5 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Order Statistics
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Active pipeline distribution by status
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("all-orders")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              All Orders <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <InteractiveDonutChart
            centerLabel="Active Orders"
            centerValue={summary.totalOrders}
            segments={[
              { label: "Completed", value: summary.completedOrders, color: "#8B5CF6" },
              { label: "In Progress", value: summary.inProgressOrders, color: "#22C55E" },
              { label: "Pending", value: summary.pendingOrders, color: "#9CA3AF" },
              { label: "Cancelled", value: summary.cancelledOrders, color: "#D50000" },
            ]}
          />
        </GlassCard>
      </div>

      {/* Profit & Loss Overview + Revenue Overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Revenue Overview
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                6-month completed order revenue trajectory
              </p>
            </div>
            <Layers className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <InteractiveAreaChart
            data={summary.monthlySeries.map((m) => ({
              label: m.label,
              value: m.revenue,
            }))}
            currency={currency}
            valueLabel="Realized Monthly Revenue"
            accentColor="#8B5CF6"
          />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Profit and Loss Overview
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                6-month net profit/loss trend after overheads
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("profit-loss")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              Full P&L <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <InteractiveAreaChart
            data={summary.monthlySeries.map((m) => ({
              label: m.label,
              value: m.profit,
            }))}
            currency={currency}
            valueLabel="Monthly Net Profit / Loss"
            accentColor="#22C55E"
            negativeColor="#D50000"
          />
        </GlassCard>
      </div>

      {/* Bottom Operational Row: Recent Orders, Low Stock Alerts, Today's Attendance */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Recent Orders */}
        <GlassCard className="p-5 xl:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Recent Orders
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Latest manufacturing contracts logged by DP ENTERPRISES
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("all-orders")}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              View All
            </button>
          </div>

          {summary.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              No orders recorded yet. Use Take New Order to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2.5 font-semibold">Order</th>
                    <th className="pb-2.5 font-semibold">Client</th>
                    <th className="pb-2.5 font-semibold">Qty</th>
                    <th className="pb-2.5 font-semibold">Value</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {summary.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setActiveModule("all-orders")}
                      className="cursor-pointer transition hover:bg-[var(--bg-subtle)]"
                    >
                      <td className="py-2.5 font-bold text-[#8B5CF6] tabular-nums">
                        {order.id}
                      </td>
                      <td className="py-2.5">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {order.companyName}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {order.garmentType}
                        </p>
                      </td>
                      <td className="py-2.5 font-medium text-[var(--text-secondary)] tabular-nums">
                        {formatNumber(order.quantity)}
                      </td>
                      <td className="py-2.5 font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(order.orderValue, currency)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge
                          label={order.status}
                          tone={
                            order.status === "Completed"
                              ? "positive"
                              : order.status === "In Progress"
                              ? "violet"
                              : order.status === "Cancelled"
                              ? "rosso"
                              : "neutral"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Low Stock Alerts */}
        <GlassCard className="p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Low Stock Alerts
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Below minimum threshold
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("stock")}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              Stock In
            </button>
          </div>

          <div className="space-y-2.5">
            {summary.lowStockMaterials.length === 0 ? (
              <div className="rounded-xl border border-[var(--positive-border)] bg-[var(--positive-soft)] p-4 text-xs font-medium text-[var(--positive)]">
                All inventory materials are above minimum stock levels.
              </div>
            ) : (
              summary.lowStockMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="rounded-xl border border-[var(--rosso-border)] bg-[var(--rosso-soft)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {mat.name}
                    </p>
                    <span className="shrink-0 text-[11px] font-extrabold text-[#D50000] tabular-nums">
                      {mat.availableQuantity} {mat.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)] tabular-nums">
                    Min required: {mat.minimumStockLevel} {mat.unit} · {mat.category}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Today's Attendance */}
        <GlassCard className="p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Today&apos;s Attendance
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatDate(todayISO)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("attendance")}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline"
            >
              Mark Log
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-[var(--positive-border)] bg-[var(--positive-soft)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Present</span>
              <span className="text-sm font-extrabold text-[var(--positive)] tabular-nums">
                {summary.presentToday}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--violet-border)] bg-[var(--violet-soft)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Half-Day</span>
              <span className="text-sm font-extrabold text-[#8B5CF6] tabular-nums">
                {summary.halfDayToday}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">On Leave</span>
              <span className="text-sm font-extrabold text-[var(--text-secondary)] tabular-nums">
                {summary.leaveToday}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--rosso-border)] bg-[var(--rosso-soft)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Absent</span>
              <span className="text-sm font-extrabold text-[#D50000] tabular-nums">
                {summary.absentToday}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--border-glass)] pt-3 text-xs text-[var(--text-secondary)]">
            Inventory Stock Value:{" "}
            <strong className="text-[var(--text-primary)] tabular-nums">
              {formatCurrency(summary.totalInventoryValue, currency)}
            </strong>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
