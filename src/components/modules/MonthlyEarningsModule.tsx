"use client";

import React, { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import {
  computePeriodProfitLoss,
  getAllYearsInState,
} from "@/lib/calculations";
import { formatCurrency, formatDate, formatNumber, getMonthLabel } from "@/lib/format";
import {
  InteractiveBarChart,
} from "@/components/charts/GarmentCharts";
import { GlassCard, INPUT_CLASS, StatusBadge } from "@/components/ui/GlassPrimitives";

export function MonthlyEarningsModule() {
  const { state } = useGarmentFlow();
  const { currency } = state.settings;
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const years = useMemo(
    () => getAllYearsInState(state, now.getFullYear()),
    [state, now]
  );

  const current = useMemo(
    () => computePeriodProfitLoss(state, { year, month }),
    [state, year, month]
  );

  const prevPeriod = useMemo(() => {
    const d = new Date(year, month - 2, 1);
    return computePeriodProfitLoss(state, {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }, [state, year, month]);

  const yearlyComparison = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const pl = computePeriodProfitLoss(state, { year, month: m });
      return {
        label: getMonthLabel(m),
        revenue: pl.realizedRevenue,
        expenses: pl.totalOrderCosts + pl.generalExpenses,
        profit: pl.netProfitLoss,
      };
    });
  }, [state, year]);

  const revDelta = current.realizedRevenue - prevPeriod.realizedRevenue;
  const profitDelta = current.netProfitLoss - prevPeriod.netProfitLoss;
  const isProfit = current.netProfitLoss >= 0;

  return (
    <div className="space-y-5">
      {/* Month & Year Selector */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              Realized Earnings · {getMonthLabel(month, year)}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Only <strong className="text-[var(--text-primary)]">Completed</strong>{" "}
              orders count toward realized revenue. Pending & In-Progress orders appear
              separately below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="Select month"
              className={`${INPUT_CLASS} w-auto`}
            >
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Select year"
              className={`${INPUT_CLASS} w-auto tabular-nums`}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Completed Order Revenue
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {formatCurrency(current.realizedRevenue, currency)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">
            vs prev month:{" "}
            <span
              className={
                revDelta >= 0 ? "text-[var(--positive)]" : "text-[#D50000]"
              }
            >
              {revDelta >= 0 ? "+" : ""}
              {formatCurrency(revDelta, currency)}
            </span>
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Order Costs
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(current.totalOrderCosts, currency)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Material + Labour + Other direct costs
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total General Expenses
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[#D50000] tabular-nums">
            {formatCurrency(current.generalExpenses, currency)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {current.periodExpenses.length} expense entries logged
          </p>
        </GlassCard>

        <GlassCard
          className={`p-5 ${
            !isProfit ? "border-[var(--rosso-border)]" : "border-[var(--positive-border)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {isProfit ? "Monthly Profit" : "Monthly Loss"}
            </span>
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-[var(--positive)]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[#D50000]" />
            )}
          </div>
          <p
            className={`mt-2 text-2xl font-extrabold tabular-nums ${
              isProfit ? "text-[var(--positive)]" : "text-[#D50000]"
            }`}
          >
            {formatCurrency(current.netProfitLoss, currency)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">
            vs prev month: {profitDelta >= 0 ? "+" : ""}
            {formatCurrency(profitDelta, currency)}
          </p>
        </GlassCard>
      </div>

      {/* Monthly Revenue & Expense Comparison Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Monthly Revenue vs. Expenses ({year})
          </h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            12-month realized revenue against total costs & overheads
          </p>
          <InteractiveBarChart
            data={yearlyComparison.map((m) => ({
              label: m.label,
              primary: m.revenue,
              secondary: m.expenses,
            }))}
            primaryLabel="Completed Revenue"
            secondaryLabel="Costs & Expenses"
            primaryColor="#8B5CF6"
            secondaryColor="#D50000"
            currency={currency}
          />
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Monthly Profit Comparison ({year})
          </h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Month-over-month net profitability across {year}
          </p>
          <InteractiveBarChart
            data={yearlyComparison.map((m) => ({
              label: m.label,
              primary: m.profit,
            }))}
            primaryLabel="Net Profit / Loss"
            primaryColor="#22C55E"
            currency={currency}
          />
        </GlassCard>
      </div>

      {/* Completed Orders vs Pipeline */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Completed Order Summary ({getMonthLabel(month, year)})
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Orders counted in realized revenue
              </p>
            </div>
            <StatusBadge
              label={`${current.completedOrders.length} Completed`}
              tone="positive"
            />
          </div>

          {current.completedOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No completed orders in {getMonthLabel(month, year)}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Revenue</th>
                    <th className="pb-2">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {current.completedOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 font-bold text-[#8B5CF6]">{o.id}</td>
                      <td className="py-2 font-semibold">{o.companyName}</td>
                      <td className="py-2 tabular-nums">{formatNumber(o.quantity)}</td>
                      <td className="py-2 font-bold tabular-nums">
                        {formatCurrency(o.orderValue, currency)}
                      </td>
                      <td className="py-2 text-[var(--text-secondary)] tabular-nums">
                        {formatCurrency(o.orderCost, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Pending & In-Progress Pipeline (Excluded)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Unrealized value: {formatCurrency(current.pipelineValue, currency)}
              </p>
            </div>
            <StatusBadge
              label={`${current.pipelineOrders.length} Unrealized`}
              tone="violet"
            />
          </div>

          {current.pipelineOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No pending or in-progress orders placed in {getMonthLabel(month, year)}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2">Expected Value</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {current.pipelineOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 font-bold text-[#8B5CF6]">{o.id}</td>
                      <td className="py-2 font-semibold">{o.companyName}</td>
                      <td className="py-2">{formatDate(o.expectedCompletionDate)}</td>
                      <td className="py-2 font-bold tabular-nums">
                        {formatCurrency(o.orderValue, currency)}
                      </td>
                      <td className="py-2">
                        <StatusBadge
                          label={o.status}
                          tone={o.status === "In Progress" ? "violet" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
