"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Check } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { getMaterialStockStats } from "@/lib/calculations";
import { formatDate, formatNumber, toISODate } from "@/lib/format";
import type { StockMovementType } from "@/types/garmentflow";
import {
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const MOVEMENT_TYPES: StockMovementType[] = [
  "Stock In",
  "Stock Out",
  "Order Consumption",
  "Wastage",
  "Stock Adjustment",
];

export function StockModule() {
  const { state, recordStockMovement, pushToast } = useGarmentFlow();

  const [materialId, setMaterialId] = useState(state.materials[0]?.id ?? "");
  const [movementType, setMovementType] = useState<StockMovementType>("Stock In");
  const [adjustmentDirection, setAdjustmentDirection] = useState<"increase" | "decrease">(
    "increase"
  );
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [reason, setReason] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterMaterial, setFilterMaterial] = useState<string>("All");

  const selectedMaterial = useMemo(
    () =>
      state.materials.find((m) => m.id === materialId) ??
      state.materials[0] ??
      null,
    [state.materials, materialId]
  );

  const selectedStats = useMemo(() => {
    if (!selectedMaterial) return null;
    return getMaterialStockStats(selectedMaterial, state.stockMovements);
  }, [selectedMaterial, state.stockMovements]);

  const globalTotals = useMemo(() => {
    const totalIn = state.stockMovements
      .filter((m) => m.delta > 0)
      .reduce((s, m) => s + m.delta, 0);
    const totalOut = state.stockMovements
      .filter((m) => m.delta < 0)
      .reduce((s, m) => s + Math.abs(m.delta), 0);
    const consumption = state.stockMovements
      .filter((m) => m.movementType === "Order Consumption")
      .reduce((s, m) => s + m.quantity, 0);
    const wastage = state.stockMovements
      .filter((m) => m.movementType === "Wastage")
      .reduce((s, m) => s + m.quantity, 0);
    const currentAvailable = state.materials.reduce(
      (s, m) => s + m.availableQuantity,
      0
    );
    return { totalIn, totalOut, consumption, wastage, currentAvailable };
  }, [state.stockMovements, state.materials]);

  const filteredMovements = useMemo(() => {
    return state.stockMovements
      .filter((m) => filterType === "All" || m.movementType === filterType)
      .filter((m) => filterMaterial === "All" || m.materialId === filterMaterial)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.stockMovements, filterType, filterMaterial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedMaterial?.id ?? materialId;
    const res = recordStockMovement({
      materialId: targetId,
      movementType,
      quantity: Number(quantity),
      adjustmentDirection,
      date,
      reason,
      relatedOrderId: relatedOrderId || undefined,
      notes,
    });

    if (!res.ok) {
      pushToast({
        type: "error",
        title: "Stock movement blocked",
        description: res.error,
      });
      return;
    }

    pushToast({
      type: "success",
      title: `${movementType} recorded`,
      description: `${selectedMaterial?.name ?? "Material"} inventory updated.`,
    });
    setQuantity("");
    setReason("");
    setNotes("");
  };

  return (
    <div className="space-y-5">
      {/* Global Stock Movement Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Current Available Stock
          </span>
          <p className="mt-1.5 text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {formatNumber(globalTotals.currentAvailable)} units
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Stock In
          </span>
          <p className="mt-1.5 text-xl font-extrabold text-[var(--positive)] tabular-nums">
            +{formatNumber(globalTotals.totalIn)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Stock Out
          </span>
          <p className="mt-1.5 text-xl font-extrabold text-[#D50000] tabular-nums">
            -{formatNumber(globalTotals.totalOut)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Order Consumption
          </span>
          <p className="mt-1.5 text-xl font-extrabold text-[#8B5CF6] tabular-nums">
            {formatNumber(globalTotals.consumption)}
          </p>
        </GlassCard>
        <GlassCard className="col-span-2 p-4 sm:col-span-1">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Wastage Logged
          </span>
          <p className="mt-1.5 text-xl font-extrabold text-[#D50000] tabular-nums">
            {formatNumber(globalTotals.wastage)}
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Record Movement Form */}
        <GlassCard className="p-5 xl:col-span-5">
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">
            Record Stock Movement
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Inventory updates automatically and negative balances are blocked.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Material *</label>
              <select
                value={selectedMaterial?.id ?? ""}
                onChange={(e) => setMaterialId(e.target.value)}
                className={INPUT_CLASS}
              >
                {state.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.availableQuantity} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterial && selectedStats && (
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-3 text-xs">
                <div>
                  <span className="text-[var(--text-muted)]">Available</span>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {formatNumber(selectedMaterial.availableQuantity)}{" "}
                    {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Consumed / Wastage</span>
                  <p className="font-semibold text-[var(--text-secondary)] tabular-nums">
                    {selectedStats.consumption} / {selectedStats.wastage}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as StockMovementType)
                  }
                  className={INPUT_CLASS}
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  Quantity ({selectedMaterial?.unit ?? "units"}) *
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            </div>

            {movementType === "Stock Adjustment" && (
              <div>
                <label className={LABEL_CLASS}>Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentDirection("increase")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      adjustmentDirection === "increase"
                        ? "border-[#8B5CF6] bg-[var(--violet-soft)] text-[#8B5CF6]"
                        : "border-[var(--border-glass)] text-[var(--text-secondary)]"
                    }`}
                  >
                    + Increase Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentDirection("decrease")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      adjustmentDirection === "decrease"
                        ? "border-[#D50000] bg-[var(--rosso-soft)] text-[#D50000]"
                        : "border-[var(--border-glass)] text-[var(--text-secondary)]"
                    }`}
                  >
                    − Decrease Stock
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Related Order (Optional)</label>
                <select
                  value={relatedOrderId}
                  onChange={(e) => setRelatedOrderId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">None</option>
                  {state.orders
                    .filter((o) => !o.archived)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} · {o.companyName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Supplier batch receipt, Cutting floor allocation"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={!selectedMaterial}
              className="gf-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Record Stock Movement
            </button>
          </form>
        </GlassCard>

        {/* Stock Movement History */}
        <GlassCard className="p-5 xl:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                Stock Movement History
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Complete audit trail of inward, outward & wastage logs
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Filter movement type"
                className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
              >
                <option value="All">All Types</option>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                aria-label="Filter movement material"
                className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
              >
                <option value="All">All Materials</option>
                {state.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No stock movements recorded"
              description="Record a Stock In, Order Consumption, or Wastage entry on the left."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2.5 pr-3 font-semibold">Date</th>
                    <th className="pb-2.5 pr-3 font-semibold">Material</th>
                    <th className="pb-2.5 pr-3 font-semibold">Type</th>
                    <th className="pb-2.5 pr-3 font-semibold">Qty Change</th>
                    <th className="pb-2.5 pr-3 font-semibold">Order</th>
                    <th className="pb-2.5 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[var(--bg-subtle)]">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-[var(--text-secondary)]">
                        {formatDate(mov.date)}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-[var(--text-primary)]">
                        {mov.materialName}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge
                          label={mov.movementType}
                          tone={
                            mov.delta > 0
                              ? "positive"
                              : mov.movementType === "Wastage"
                              ? "rosso"
                              : "violet"
                          }
                        />
                      </td>
                      <td
                        className={`py-2.5 pr-3 font-bold tabular-nums ${
                          mov.delta >= 0 ? "text-[var(--positive)]" : "text-[#D50000]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {mov.delta >= 0 ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          {mov.delta >= 0 ? `+${mov.delta}` : mov.delta}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-[#8B5CF6]">
                        {mov.relatedOrderId ?? "—"}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        <p>{mov.reason}</p>
                        {mov.notes && (
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {mov.notes}
                          </p>
                        )}
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
