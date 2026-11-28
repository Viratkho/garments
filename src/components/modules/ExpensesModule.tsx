"use client";

import React, { useMemo, useState } from "react";
import { Edit3, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { getMonthExpensesByCategory, getYearMonth } from "@/lib/calculations";
import { formatCurrency, formatDate, getMonthLabel, toISODate } from "@/lib/format";
import type { ExpenseCategory, ExpenseRecord } from "@/types/garmentflow";
import { HorizontalCategoryBars } from "@/components/charts/GarmentCharts";
import {
  ConfirmDialog,
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Electricity",
  "Transportation",
  "Packaging",
  "Machine Maintenance",
  "Rent",
  "Other Expenses",
];

const emptyExpense = () => ({
  name: "",
  category: "Electricity" as ExpenseCategory,
  amount: "",
  date: toISODate(new Date()),
  description: "",
  notes: "",
});

export function ExpensesModule() {
  const {
    state,
    globalSearch,
    addExpense,
    updateExpense,
    deleteExpense,
    pushToast,
  } = useGarmentFlow();
  const { currency } = state.settings;
  const now = new Date();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [monthFilter, setMonthFilter] = useState<string>(
    String(now.getMonth() + 1)
  );
  const [yearFilter, setYearFilter] = useState<number>(now.getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [form, setForm] = useState(emptyExpense);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);

  const q = (search || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return state.expenses
      .filter((e) => catFilter === "All" || e.category === catFilter)
      .filter((e) => {
        const ym = getYearMonth(e.date);
        if (!ym || ym.year !== yearFilter) return false;
        if (monthFilter !== "All" && ym.month !== Number(monthFilter)) return false;
        return true;
      })
      .filter((e) => {
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.expenses, catFilter, monthFilter, yearFilter, q]);

  const totalFiltered = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const categoryBreakdown = useMemo(
    () =>
      getMonthExpensesByCategory(
        state.expenses,
        yearFilter,
        monthFilter === "All" ? undefined : Number(monthFilter)
      ).map((item) => ({
        label: item.category,
        value: item.amount,
        color: "#D50000",
      })),
    [state.expenses, yearFilter, monthFilter]
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyExpense());
    setModalOpen(true);
  };

  const openEdit = (exp: ExpenseRecord) => {
    setEditing(exp);
    setForm({
      name: exp.name,
      category: exp.category,
      amount: String(exp.amount),
      date: exp.date,
      description: exp.description,
      notes: exp.notes,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description.trim(),
      notes: form.notes.trim(),
    };
    if (editing) {
      updateExpense(editing.id, payload);
      pushToast({ type: "success", title: `${payload.name} updated` });
      setModalOpen(false);
      return;
    }
    const res = addExpense(payload);
    if (res.ok) {
      pushToast({ type: "success", title: "Expense recorded" });
      setModalOpen(false);
    } else {
      pushToast({ type: "error", title: "Validation error", description: res.error });
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary & Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Expenses ({monthFilter === "All" ? yearFilter : getMonthLabel(Number(monthFilter), yearFilter)})
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[#D50000] tabular-nums">
            {formatCurrency(totalFiltered, currency)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Expense Entries
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {filtered.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Top Overhead Category
          </span>
          <p className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)]">
            {categoryBreakdown[0]?.label ?? "—"}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label="Filter expenses by category"
              className={`${INPUT_CLASS} w-auto`}
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter expenses by month"
              className={`${INPUT_CLASS} w-auto`}
            >
              <option value="All">All Months</option>
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              aria-label="Filter expenses by year"
              className={`${INPUT_CLASS} w-24 tabular-nums`}
            />
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="gf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="p-5 xl:col-span-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses for this period"
              description="Log electricity, rent, packaging, transportation, or machine maintenance expenses."
              actionLabel="Add Expense"
              onAction={openAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2.5 pr-3 font-semibold">Expense Name</th>
                    <th className="pb-2.5 pr-3 font-semibold">Category</th>
                    <th className="pb-2.5 pr-3 font-semibold">Date</th>
                    <th className="pb-2.5 pr-3 font-semibold">Amount</th>
                    <th className="pb-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[var(--bg-subtle)]">
                      <td className="py-3 pr-3">
                        <p className="font-bold text-[var(--text-primary)]">
                          {exp.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {exp.description || exp.notes || "—"}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge label={exp.category} tone="neutral" />
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap text-[var(--text-secondary)]">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-[#D50000] tabular-nums">
                        {formatCurrency(exp.amount, currency)}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(exp)}
                          aria-label={`Edit ${exp.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp)}
                          aria-label={`Delete ${exp.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--rosso-soft)] hover:text-[#D50000]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <GlassCard className="h-fit p-5 xl:col-span-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Expense Categories
          </h2>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Category-wise factory overhead distribution
          </p>
          <HorizontalCategoryBars
            items={categoryBreakdown}
            currency={currency}
            accentColor="#D50000"
          />
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="gf-glass-strong gf-modal-enter w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {editing ? `Edit ${editing.name}` : "Record Business Expense"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className={LABEL_CLASS}>Expense Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Industrial Power Bill"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ExpenseCategory })
                    }
                    className={INPUT_CLASS}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Amount ({currency}) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Expense Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[var(--border-glass)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gf-btn-primary rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  {editing ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This permanently removes the expense entry from financial calculations."
        confirmLabel="Delete Expense"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteExpense(deleteTarget.id);
            pushToast({ type: "info", title: "Expense deleted" });
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
