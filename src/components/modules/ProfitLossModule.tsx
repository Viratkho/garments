"use client";

import React, { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import {
  computePeriodProfitLoss,
  getAllYearsInState,
  getMonthExpensesByCategory,
} from "@/lib/calculations";
import { formatCurrency, getMonthLabel } from "@/lib/format";
import {
  HorizontalCategoryBars,
  InteractiveAreaChart,
  InteractiveBarChart,
} from "@/components/charts/GarmentCharts";
import { GlassCard, INPUT_CLASS, StatusBadge } from "@/components/ui/GlassPrimitives";

export function ProfitLossModule() {
  const { state } = useGarmentFlow();
  const { currency } = state.settings;
  const now = new Date();

  const [scope, setScope] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const years = useMemo(
    () => getAllYearsInState(state, now.getFullYear()),
    [state, now]
  );

  const pl = useMemo(
    () =>
      computePeriodProfitLoss(state, {
        year,
        month: scope === "monthly" ? month : undefined,
      }),
    [state, year, month, scope]
  );

  const yearlyTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const res = computePeriodProfitLoss(state, { year, month: m });
      return {
        label: getMonthLabel(m),
        revenue: res.realizedRevenue,
        totalExpense: res.totalOrderCosts + res.generalExpenses,
        profit: res.netProfitLoss,
      };
    });
  }, [state, year]);

  const expenseBreakdown = useMemo(
    () =>
      getMonthExpensesByCategory(
        state.expenses,
        year,
        scope === "monthly" ? month : undefined
      ).map((item) => ({
        label: item.category,
        value: item.amount,
        color: "#D50000",
      })),
    [state.expenses, year, month, scope]
  );

  const isProfit = pl.netProfitLoss >= 0;

  return (
    <div className="space-y-5">
      {/* Scope & Period Header */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-1">
            <button
              type="button"
              onClick={() => setScope("monthly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                scope === "monthly"
                  ? "bg-[#8B5CF6] text-[#F5F5F0]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Monthly Profit / Loss
            </button>
            <button
              type="button"
              onClick={() => setScope("yearly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                scope === "yearly"
                  ? "bg-[#8B5CF6] text-[#F5F5F0]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Yearly Profit / Loss
            </button>
          </div>

          <div className="flex items-center gap-2">
            {scope === "monthly" && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                aria-label="Select P&L month"
                className={`${INPUT_CLASS} w-auto`}
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
            )}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Select P&L year"
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

      {/* P&L Statement Summary Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <GlassCard className="p-4">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Total Revenue
          </span>
          <p className="mt-1 text-lg font-extrabold text-[#8B5CF6] tabular-nums">
            {formatCurrency(pl.realizedRevenue, currency)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Material Costs
          </span>
          <p className="mt-1 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(pl.materialCosts, currency)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Labour Costs
          </span>
          <p className="mt-1 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(pl.labourCosts, currency)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Other Order Costs
          </span>
          <p className="mt-1 text-lg font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatCurrency(pl.otherOrderCosts, currency)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            General Expenses
          </span>
          <p className="mt-1 text-lg font-extrabold text-[#D50000] tabular-nums">
            {formatCurrency(pl.generalExpenses, currency)}
          </p>
        </GlassCard>
        <GlassCard
          className={`p-4 ${
            isProfit ? "border-[var(--positive-border)]" : "border-[var(--rosso-border)]"
          }`}
        >
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Net Profit / Loss
          </span>
          <p
            className={`mt-1 text-lg font-extrabold tabular-nums ${
              isProfit ? "text-[var(--positive)]" : "text-[#D50000]"
            }`}
          >
            {formatCurrency(pl.netProfitLoss, currency)}
          </p>
        </GlassCard>
        <GlassCard className="col-span-2 p-4 sm:col-span-1">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            Profit Margin
          </span>
          <p
            className={`mt-1 text-lg font-extrabold tabular-nums ${
              isProfit ? "text-[var(--positive)]" : "text-[#D50000]"
            }`}
          >
            {pl.profitMargin.toFixed(1)}%
          </p>
        </GlassCard>
      </div>

      {/* Double-Counting Safeguard Card */}
      <GlassCard className="border-[var(--violet-border)] p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--violet-soft)] text-[#8B5CF6]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-bold text-[var(--text-primary)]">
              Formula & Double-Counting Safeguard Active
            </p>
            <p className="mt-1 text-[var(--text-secondary)]">
              Business Profit/Loss = Completed Order Revenue (
              {formatCurrency(pl.realizedRevenue, currency)}) − Completed Order Costs (
              {formatCurrency(pl.totalOrderCosts, currency)}) − General Business Expenses (
              {formatCurrency(pl.generalExpenses, currency)}). Stock consumption audit value (
              {formatCurrency(pl.stockConsumptionAuditValue, currency)}) and recorded worker
              salaries ({formatCurrency(pl.recordedSalariesAudit, currency)}) are tracked as
              operational reconciliation references and are{" "}
              <strong className="text-[var(--text-primary)]">never double-counted</strong>{" "}
              on top of order-level material & labour costs.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Revenue vs Expense & Profit Trend Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Revenue vs. Expense Chart ({year})
          </h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Completed order revenue vs. combined order & overhead outflows
          </p>
          <InteractiveBarChart
            data={yearlyTrend.map((m) => ({
              label: m.label,
              primary: m.revenue,
              secondary: m.totalExpense,
            }))}
            primaryLabel="Revenue"
            secondaryLabel="Total Outflow"
            primaryColor="#8B5CF6"
            secondaryColor="#D50000"
            currency={currency}
          />
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Profit Trend Chart ({year})
          </h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Net monthly profit/loss trajectory
          </p>
          <InteractiveAreaChart
            data={yearlyTrend.map((m) => ({
              label: m.label,
              value: m.profit,
            }))}
            currency={currency}
            valueLabel="Net Profit / Loss"
            accentColor="#22C55E"
            negativeColor="#D50000"
          />
        </GlassCard>
      </div>

      {/* Order-Wise Profitability & Expense Breakdown */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="p-5 xl:col-span-8">
          <h3 className="mb-3 text-base font-bold text-[var(--text-primary)]">
            Order-Wise Profitability
          </h3>
          {pl.completedOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--text-muted)]">
              No completed orders in this selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2.5 pr-3">Order</th>
                    <th className="pb-2.5 pr-3">Client</th>
                    <th className="pb-2.5 pr-3">Revenue</th>
                    <th className="pb-2.5 pr-3">Material</th>
                    <th className="pb-2.5 pr-3">Labour</th>
                    <th className="pb-2.5 pr-3">Other</th>
                    <th className="pb-2.5 pr-3">Gross Profit</th>
                    <th className="pb-2.5">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {pl.completedOrders.map((o) => {
                    const margin =
                      o.orderValue > 0
                        ? ((o.expectedProfit / o.orderValue) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr key={o.id} className="hover:bg-[var(--bg-subtle)]">
                        <td className="py-2.5 pr-3 font-bold text-[#8B5CF6]">{o.id}</td>
                        <td className="py-2.5 pr-3 font-semibold">{o.companyName}</td>
                        <td className="py-2.5 pr-3 font-bold tabular-nums">
                          {formatCurrency(o.orderValue, currency)}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {formatCurrency(o.materialCost, currency)}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {formatCurrency(o.labourCost, currency)}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {formatCurrency(o.otherCosts, currency)}
                        </td>
                        <td
                          className={`py-2.5 pr-3 font-bold tabular-nums ${
                            o.expectedProfit >= 0
                              ? "text-[var(--positive)]"
                              : "text-[#D50000]"
                          }`}
                        >
                          {formatCurrency(o.expectedProfit, currency)}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge
                            label={`${margin}%`}
                            tone={o.expectedProfit >= 0 ? "positive" : "rosso"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="h-fit p-5 xl:col-span-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Expense Breakdown
          </h3>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            General overheads deducted in this period
          </p>
          <HorizontalCategoryBars
            items={expenseBreakdown}
            currency={currency}
            accentColor="#D50000"
          />
        </GlassCard>
      </div>
    </div>
  );
}
