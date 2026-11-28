"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calculator, Check, RotateCcw } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { computeOrderFinancials } from "@/lib/calculations";
import { formatCurrency, formatNumber, toISODate } from "@/lib/format";
import type { OrderStatus, PricingMethod } from "@/types/garmentflow";
import {
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const GARMENT_ACTIVITIES = [
  "Bulk Garment Stitching",
  "Collar Stitching",
  "Pocket Stitching",
  "Custom Garment Designs",
  "Material Supply",
  "Stitching-Only Orders",
  "Material & Stitching Combined",
];

interface OrderFormState {
  companyName: string;
  contactNumber: string;
  garmentType: string;
  description: string;
  quantity: string;
  pricingMethod: PricingMethod;
  perPieceRate: string;
  fixedOrderValue: string;
  materialCost: string;
  labourCost: string;
  otherCosts: string;
  orderDate: string;
  expectedCompletionDate: string;
  status: OrderStatus;
  notes: string;
}

function emptyOrderForm(): OrderFormState {
  const today = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 14);
  return {
    companyName: "",
    contactNumber: "",
    garmentType: "Bulk Garment Stitching",
    description: "",
    quantity: "",
    pricingMethod: "per-piece",
    perPieceRate: "",
    fixedOrderValue: "",
    materialCost: "0",
    labourCost: "0",
    otherCosts: "0",
    orderDate: toISODate(today),
    expectedCompletionDate: toISODate(future),
    status: "Pending",
    notes: "",
  };
}

export function TakeNewOrderModule() {
  const {
    state,
    editingOrderId,
    setEditingOrderId,
    addOrder,
    updateOrder,
    setActiveModule,
    pushToast,
  } = useGarmentFlow();

  const editingOrder = useMemo(
    () => state.orders.find((o) => o.id === editingOrderId) ?? null,
    [state.orders, editingOrderId]
  );

  const [form, setForm] = useState<OrderFormState>(emptyOrderForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingOrder) {
      setForm({
        companyName: editingOrder.companyName,
        contactNumber: editingOrder.contactNumber,
        garmentType: editingOrder.garmentType,
        description: editingOrder.description,
        quantity: String(editingOrder.quantity),
        pricingMethod: editingOrder.pricingMethod,
        perPieceRate: String(editingOrder.perPieceRate),
        fixedOrderValue: String(editingOrder.fixedOrderValue),
        materialCost: String(editingOrder.materialCost),
        labourCost: String(editingOrder.labourCost),
        otherCosts: String(editingOrder.otherCosts),
        orderDate: editingOrder.orderDate,
        expectedCompletionDate: editingOrder.expectedCompletionDate,
        status: editingOrder.status,
        notes: editingOrder.notes,
      });
      setErrors({});
    } else {
      setForm(emptyOrderForm());
      setErrors({});
    }
  }, [editingOrder]);

  const preview = useMemo(
    () =>
      computeOrderFinancials({
        quantity: Number(form.quantity) || 0,
        pricingMethod: form.pricingMethod,
        perPieceRate: Number(form.perPieceRate) || 0,
        fixedOrderValue: Number(form.fixedOrderValue) || 0,
        materialCost: Number(form.materialCost) || 0,
        labourCost: Number(form.labourCost) || 0,
        otherCosts: Number(form.otherCosts) || 0,
      }),
    [form]
  );

  const margin =
    preview.orderValue > 0
      ? ((preview.expectedProfit / preview.orderValue) * 100).toFixed(1)
      : "0.0";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) next.companyName = "Company or customer name is required.";
    if (!form.contactNumber.trim()) next.contactNumber = "Contact number is required.";
    if (!form.garmentType.trim()) next.garmentType = "Garment type is required.";
    if (Number(form.quantity) <= 0) next.quantity = "Enter a valid quantity (> 0).";
    if (form.pricingMethod === "per-piece" && Number(form.perPieceRate) <= 0) {
      next.perPieceRate = "Per-piece rate must be greater than 0.";
    }
    if (form.pricingMethod === "fixed" && Number(form.fixedOrderValue) <= 0) {
      next.fixedOrderValue = "Fixed order value must be greater than 0.";
    }
    if (!form.expectedCompletionDate) {
      next.expectedCompletionDate = "Expected completion date is required.";
    }
    if (
      Number(form.materialCost) < 0 ||
      Number(form.labourCost) < 0 ||
      Number(form.otherCosts) < 0
    ) {
      next.costs = "Cost values cannot be negative.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      pushToast({
        type: "error",
        title: "Validation error",
        description: "Please review the highlighted order fields.",
      });
      return;
    }

    const payload = {
      companyName: form.companyName.trim(),
      contactNumber: form.contactNumber.trim(),
      garmentType: form.garmentType.trim(),
      description: form.description.trim(),
      quantity: Number(form.quantity),
      pricingMethod: form.pricingMethod,
      perPieceRate: form.pricingMethod === "per-piece" ? Number(form.perPieceRate) : 0,
      fixedOrderValue: form.pricingMethod === "fixed" ? Number(form.fixedOrderValue) : 0,
      materialCost: Number(form.materialCost) || 0,
      labourCost: Number(form.labourCost) || 0,
      otherCosts: Number(form.otherCosts) || 0,
      orderDate: form.orderDate,
      expectedCompletionDate: form.expectedCompletionDate,
      status: form.status,
      notes: form.notes.trim(),
    };

    if (editingOrder) {
      const res = updateOrder(editingOrder.id, payload);
      if (res.ok) {
        pushToast({
          type: "success",
          title: `Order ${editingOrder.id} updated`,
          description: `${payload.companyName} · ${formatCurrency(preview.orderValue, state.settings.currency)}`,
        });
        setEditingOrderId(null);
        setActiveModule("all-orders");
      } else {
        pushToast({ type: "error", title: "Could not update order", description: res.error });
      }
      return;
    }

    const res = addOrder(payload);
    if (res.ok) {
      pushToast({
        type: "success",
        title: `Order ${res.id} saved`,
        description: `${payload.companyName} (${formatNumber(payload.quantity)} pcs)`,
      });
      setForm(emptyOrderForm());
      setErrors({});
    } else {
      pushToast({ type: "error", title: "Order rejected", description: res.error });
    }
  };

  const handleClear = () => {
    setEditingOrderId(null);
    setForm(emptyOrderForm());
    setErrors({});
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Main Form */}
      <GlassCard className="p-5 sm:p-6 xl:col-span-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-glass)] pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text-primary)]">
              {editingOrder ? `Edit Order ${editingOrder.id}` : "New Bulk Garment Order"}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Choose per-piece or fixed contract pricing and estimate production costs.
            </p>
          </div>
          {editingOrder && (
            <StatusBadge label={`Editing ${editingOrder.id}`} tone="violet" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gf-company" className={LABEL_CLASS}>
                Company / Customer Name *
              </label>
              <input
                id="gf-company"
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g., Vanguard Workwear Co."
                className={INPUT_CLASS}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs font-medium text-[#D50000]">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label htmlFor="gf-contact" className={LABEL_CLASS}>
                Contact Number *
              </label>
              <input
                id="gf-contact"
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="+91 98450 22110"
                className={INPUT_CLASS}
              />
              {errors.contactNumber && (
                <p className="mt-1 text-xs font-medium text-[#D50000]">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="gf-garment-type" className={LABEL_CLASS}>
              Garment Type / Activity *
            </label>
            <input
              id="gf-garment-type"
              type="text"
              value={form.garmentType}
              onChange={(e) => setForm({ ...form, garmentType: e.target.value })}
              placeholder="Select below or enter custom garment specification"
              className={INPUT_CLASS}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GARMENT_ACTIVITIES.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setForm({ ...form, garmentType: act })}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    form.garmentType === act
                      ? "border-[#8B5CF6] bg-[var(--violet-soft)] text-[#8B5CF6]"
                      : "border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
            {errors.garmentType && (
              <p className="mt-1 text-xs font-medium text-[#D50000]">{errors.garmentType}</p>
            )}
          </div>

          <div>
            <label htmlFor="gf-desc" className={LABEL_CLASS}>
              Order Description
            </label>
            <textarea
              id="gf-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Fabric GSM, stitch specification, collar/pocket details, packing instructions..."
              className={INPUT_CLASS}
            />
          </div>

          {/* Quantity & Pricing Method */}
          <div className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                Quantity & Pricing Method
              </span>
              <div className="inline-flex rounded-xl border border-[var(--border-glass)] bg-[var(--input-bg)] p-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pricingMethod: "per-piece" })}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    form.pricingMethod === "per-piece"
                      ? "bg-[#8B5CF6] text-[#F5F5F0]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Per-Piece Pricing
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pricingMethod: "fixed" })}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    form.pricingMethod === "fixed"
                      ? "bg-[#8B5CF6] text-[#F5F5F0]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Fixed Order Pricing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gf-qty" className={LABEL_CLASS}>
                  Order Quantity (Pieces) *
                </label>
                <input
                  id="gf-qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g., 500"
                  className={`${INPUT_CLASS} tabular-nums`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs font-medium text-[#D50000]">{errors.quantity}</p>
                )}
              </div>

              {form.pricingMethod === "per-piece" ? (
                <div>
                  <label htmlFor="gf-rate" className={LABEL_CLASS}>
                    Per-Piece Rate ({state.settings.currency}) *
                  </label>
                  <input
                    id="gf-rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.perPieceRate}
                    onChange={(e) => setForm({ ...form, perPieceRate: e.target.value })}
                    placeholder="e.g., 70"
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                  {errors.perPieceRate && (
                    <p className="mt-1 text-xs font-medium text-[#D50000]">
                      {errors.perPieceRate}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="gf-fixed" className={LABEL_CLASS}>
                    Fixed Order Value ({state.settings.currency}) *
                  </label>
                  <input
                    id="gf-fixed"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fixedOrderValue}
                    onChange={(e) => setForm({ ...form, fixedOrderValue: e.target.value })}
                    placeholder="e.g., 78000"
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                  {errors.fixedOrderValue && (
                    <p className="mt-1 text-xs font-medium text-[#D50000]">
                      {errors.fixedOrderValue}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Production Costs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="gf-mat-cost" className={LABEL_CLASS}>
                Material Cost
              </label>
              <input
                id="gf-mat-cost"
                type="number"
                min={0}
                value={form.materialCost}
                onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                className={`${INPUT_CLASS} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="gf-lab-cost" className={LABEL_CLASS}>
                Labour Cost
              </label>
              <input
                id="gf-lab-cost"
                type="number"
                min={0}
                value={form.labourCost}
                onChange={(e) => setForm({ ...form, labourCost: e.target.value })}
                className={`${INPUT_CLASS} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="gf-oth-cost" className={LABEL_CLASS}>
                Other Costs
              </label>
              <input
                id="gf-oth-cost"
                type="number"
                min={0}
                value={form.otherCosts}
                onChange={(e) => setForm({ ...form, otherCosts: e.target.value })}
                className={`${INPUT_CLASS} tabular-nums`}
              />
            </div>
          </div>
          {errors.costs && (
            <p className="text-xs font-medium text-[#D50000]">{errors.costs}</p>
          )}

          {/* Dates & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="gf-order-date" className={LABEL_CLASS}>
                Order Date
              </label>
              <input
                id="gf-order-date"
                type="date"
                value={form.orderDate}
                onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="gf-comp-date" className={LABEL_CLASS}>
                Expected Completion Date *
              </label>
              <input
                id="gf-comp-date"
                type="date"
                value={form.expectedCompletionDate}
                onChange={(e) =>
                  setForm({ ...form, expectedCompletionDate: e.target.value })
                }
                className={INPUT_CLASS}
              />
              {errors.expectedCompletionDate && (
                <p className="mt-1 text-xs font-medium text-[#D50000]">
                  {errors.expectedCompletionDate}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="gf-status" className={LABEL_CLASS}>
                Order Status
              </label>
              <select
                id="gf-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as OrderStatus })
                }
                className={INPUT_CLASS}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="gf-notes" className={LABEL_CLASS}>
              Additional Notes
            </label>
            <textarea
              id="gf-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Dye lot approvals, QC checkpoints, dispatch instructions..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-glass)] pt-4">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
            >
              <RotateCcw className="h-4 w-4" />
              {editingOrder ? "Cancel Edit & Clear" : "Clear Form"}
            </button>
            <button
              type="submit"
              className="gf-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <Check className="h-4 w-4" />
              {editingOrder ? "Update Order" : "Save Order"}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Live Calculation Preview */}
      <GlassCard className="h-fit p-5 sm:p-6 xl:col-span-4">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-glass)] pb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--violet-soft)] text-[#8B5CF6]">
            <Calculator className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Order Valuation Preview
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Updates live as you enter figures
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Calculated Order Value
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(preview.orderValue, state.settings.currency)}
            </p>
            {form.pricingMethod === "per-piece" && (
              <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">
                {formatNumber(Number(form.quantity) || 0)} pcs ×{" "}
                {formatCurrency(Number(form.perPieceRate) || 0, state.settings.currency)}
              </p>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Material Cost</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(Number(form.materialCost) || 0, state.settings.currency)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Labour Cost</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(Number(form.labourCost) || 0, state.settings.currency)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Other Costs</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(Number(form.otherCosts) || 0, state.settings.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border-glass)] pt-2.5 font-bold text-[var(--text-primary)]">
              <span>Total Order Cost</span>
              <span className="tabular-nums">
                {formatCurrency(preview.orderCost, state.settings.currency)}
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              preview.expectedProfit >= 0
                ? "border-[var(--positive-border)] bg-[var(--positive-soft)]"
                : "border-[var(--rosso-border)] bg-[var(--rosso-soft)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Expected Profit
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">
                {margin}% margin
              </span>
            </div>
            <p
              className={`mt-1 text-xl font-extrabold tabular-nums ${
                preview.expectedProfit >= 0 ? "text-[var(--positive)]" : "text-[#D50000]"
              }`}
            >
              {formatCurrency(preview.expectedProfit, state.settings.currency)}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
