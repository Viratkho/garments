"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { MaterialCategory, MaterialItem } from "@/types/garmentflow";
import { HorizontalCategoryBars } from "@/components/charts/GarmentCharts";
import {
  ConfirmDialog,
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const CATEGORIES: MaterialCategory[] = [
  "Cotton Fabric",
  "Polyester Fabric",
  "Collar Fabric",
  "Pocket Fabric",
  "Thread",
  "Buttons",
  "Zippers",
  "Labels",
  "Packaging Materials",
  "Others",
];

const emptyMaterial = () => ({
  name: "",
  category: "Cotton Fabric" as MaterialCategory,
  description: "",
  unit: "meters",
  availableQuantity: "0",
  minimumStockLevel: "100",
  unitCost: "0",
});

export function InventoryModule() {
  const {
    state,
    globalSearch,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    pushToast,
  } = useGarmentFlow();
  const { currency } = state.settings;

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [form, setForm] = useState(emptyMaterial);
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null);

  const q = (search || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return state.materials
      .filter((m) => catFilter === "All" || m.category === catFilter)
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      });
  }, [state.materials, catFilter, q]);

  const totalValuation = useMemo(
    () =>
      state.materials.reduce(
        (sum, m) => sum + m.availableQuantity * m.unitCost,
        0
      ),
    [state.materials]
  );

  const lowStockCount = useMemo(
    () =>
      state.materials.filter((m) => m.availableQuantity <= m.minimumStockLevel)
        .length,
    [state.materials]
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of state.materials) {
      const val = m.availableQuantity * m.unitCost;
      map.set(m.category, (map.get(m.category) ?? 0) + val);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.materials]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyMaterial());
    setModalOpen(true);
  };

  const openEdit = (mat: MaterialItem) => {
    setEditing(mat);
    setForm({
      name: mat.name,
      category: mat.category,
      description: mat.description,
      unit: mat.unit,
      availableQuantity: String(mat.availableQuantity),
      minimumStockLevel: String(mat.minimumStockLevel),
      unitCost: String(mat.unitCost),
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      unit: form.unit.trim() || "units",
      availableQuantity: Number(form.availableQuantity),
      minimumStockLevel: Number(form.minimumStockLevel),
      unitCost: Number(form.unitCost),
    };

    if (editing) {
      const res = updateMaterial(editing.id, payload);
      if (res.ok) {
        pushToast({ type: "success", title: `${payload.name} updated` });
        setModalOpen(false);
      } else {
        pushToast({ type: "error", title: "Validation error", description: res.error });
      }
      return;
    }

    const res = addMaterial(payload);
    if (res.ok) {
      pushToast({ type: "success", title: `${payload.name} added to inventory` });
      setModalOpen(false);
    } else {
      pushToast({ type: "error", title: "Validation error", description: res.error });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Materials
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {state.materials.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Inventory Stock Value
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {formatCurrency(totalValuation, currency)}
          </p>
        </GlassCard>
        <GlassCard
          className={`p-4 ${
            lowStockCount > 0 ? "border-[var(--rosso-border)]" : ""
          }`}
        >
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Low Stock Warnings
          </span>
          <p
            className={`mt-1.5 text-2xl font-extrabold tabular-nums ${
              lowStockCount > 0 ? "text-[#D50000]" : "text-[var(--positive)]"
            }`}
          >
            {lowStockCount}
          </p>
        </GlassCard>
      </div>

      {/* Filters & Add Button */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials..."
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label="Filter by material category"
              className={`${INPUT_CLASS} w-auto`}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="gf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Inventory Table / Cards */}
        <GlassCard className="p-4 sm:p-5 xl:col-span-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No materials found"
              description="Add raw fabrics, collars, threads, buttons, zippers, or packaging items to track live stock."
              actionLabel="Add Material"
              onAction={openAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-3 pr-3 font-semibold">Material</th>
                    <th className="pb-3 pr-3 font-semibold">Category</th>
                    <th className="pb-3 pr-3 font-semibold">Available</th>
                    <th className="pb-3 pr-3 font-semibold">Min Level</th>
                    <th className="pb-3 pr-3 font-semibold">Unit Cost</th>
                    <th className="pb-3 pr-3 font-semibold">Total Value</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {filtered.map((mat) => {
                    const low = mat.availableQuantity <= mat.minimumStockLevel;
                    const value = mat.availableQuantity * mat.unitCost;
                    return (
                      <tr key={mat.id} className="hover:bg-[var(--bg-subtle)]">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            {low && (
                              <AlertTriangle className="h-4 w-4 shrink-0 text-[#D50000]" />
                            )}
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">
                                {mat.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {mat.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge label={mat.category} tone="neutral" />
                        </td>
                        <td
                          className={`py-3 pr-3 font-bold tabular-nums ${
                            low ? "text-[#D50000]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {formatNumber(mat.availableQuantity)} {mat.unit}
                        </td>
                        <td className="py-3 pr-3 text-[var(--text-secondary)] tabular-nums">
                          {formatNumber(mat.minimumStockLevel)} {mat.unit}
                        </td>
                        <td className="py-3 pr-3 text-[var(--text-secondary)] tabular-nums">
                          {formatCurrency(mat.unitCost, currency)}
                        </td>
                        <td className="py-3 pr-3 font-bold text-[var(--text-primary)] tabular-nums">
                          {formatCurrency(value, currency)}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(mat)}
                              aria-label={`Edit ${mat.name}`}
                              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(mat)}
                              aria-label={`Delete ${mat.name}`}
                              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--rosso-soft)] hover:text-[#D50000]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Category Valuation Chart */}
        <GlassCard className="h-fit p-5 xl:col-span-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Inventory Categories
          </h2>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Stock valuation breakdown by material category
          </p>
          <HorizontalCategoryBars
            items={categoryBreakdown}
            currency={currency}
            accentColor="#8B5CF6"
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
                {editing ? `Edit ${editing.name}` : "Add New Material"}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>Material Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as MaterialCategory })
                    }
                    className={INPUT_CLASS}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className={LABEL_CLASS}>Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="meters, pcs"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Available Qty</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.availableQuantity}
                    onChange={(e) =>
                      setForm({ ...form, availableQuantity: e.target.value })
                    }
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Min Level</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.minimumStockLevel}
                    onChange={(e) =>
                      setForm({ ...form, minimumStockLevel: e.target.value })
                    }
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Unit Cost</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
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
                  {editing ? "Update Material" : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        description="Removing this material deletes it from current inventory. Historical stock movements remain logged."
        confirmLabel="Delete Material"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMaterial(deleteTarget.id);
            pushToast({ type: "info", title: `${deleteTarget.name} deleted` });
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
