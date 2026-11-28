"use client";

import React, { useMemo, useState } from "react";
import {
  Archive,
  ArrowUpDown,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { csvEscape, formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/garmentflow";
import {
  ConfirmDialog,
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

type SortField =
  | "id"
  | "companyName"
  | "quantity"
  | "orderValue"
  | "expectedProfit"
  | "orderDate"
  | "expectedCompletionDate";

export function AllOrdersModule() {
  const {
    state,
    globalSearch,
    setActiveModule,
    setEditingOrderId,
    updateOrder,
    deleteOrder,
    archiveOrder,
    pushToast,
  } = useGarmentFlow();
  const { currency, compactTables } = state.settings;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState<SortField>("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "archive";
    order: Order;
  } | null>(null);

  const effectiveQuery = (search || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return state.orders
      .filter((o) => (showArchived ? Boolean(o.archived) : !o.archived))
      .filter((o) => statusFilter === "All" || o.status === statusFilter)
      .filter((o) => (!dateFrom ? true : o.orderDate >= dateFrom))
      .filter((o) => (!dateTo ? true : o.orderDate <= dateTo))
      .filter((o) => {
        if (!effectiveQuery) return true;
        return (
          o.id.toLowerCase().includes(effectiveQuery) ||
          o.companyName.toLowerCase().includes(effectiveQuery) ||
          o.garmentType.toLowerCase().includes(effectiveQuery) ||
          o.description.toLowerCase().includes(effectiveQuery)
        );
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        const cmp =
          typeof valA === "number" && typeof valB === "number"
            ? valA - valB
            : String(valA).localeCompare(String(valB));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [
    state.orders,
    showArchived,
    statusFilter,
    dateFrom,
    dateTo,
    effectiveQuery,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setActiveModule("new-order");
  };

  const handleStatusChange = (order: Order, nextStatus: OrderStatus) => {
    updateOrder(order.id, { status: nextStatus });
    pushToast({
      type: "success",
      title: `Order ${order.id} marked ${nextStatus}`,
    });
  };

  const handleExportCsv = () => {
    const header = [
      "Order ID",
      "Company Name",
      "Garment Type",
      "Quantity",
      "Order Value",
      "Order Cost",
      "Expected Profit",
      "Order Date",
      "Expected Delivery",
      "Status",
    ].join(",");
    const rows = filtered.map((o) =>
      [
        o.id,
        o.companyName,
        o.garmentType,
        o.quantity,
        o.orderValue,
        o.orderCost,
        o.expectedProfit,
        o.orderDate,
        o.expectedCompletionDate,
        o.status,
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `garmentflow-orders.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: "info", title: "Orders exported as CSV" });
  };

  const statusTone = (status: OrderStatus) =>
    status === "Completed"
      ? "positive"
      : status === "In Progress"
      ? "violet"
      : status === "Cancelled"
      ? "rosso"
      : "neutral";

  return (
    <div className="space-y-5">
      {/* Filter & Action Toolbar */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search ID, company, garment..."
                aria-label="Search orders"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
              className={`${INPUT_CLASS} w-auto`}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Filter orders from date"
              className={`${INPUT_CLASS} w-auto`}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="Filter orders to date"
              className={`${INPUT_CLASS} w-auto`}
            />

            <button
              type="button"
              onClick={() => {
                setShowArchived((v) => !v);
                setPage(1);
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                showArchived
                  ? "border-[#8B5CF6] bg-[var(--violet-soft)] text-[#8B5CF6]"
                  : "border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              {showArchived ? "Viewing Archived" : "Show Archived"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--violet-border)]"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingOrderId(null);
                setActiveModule("new-order");
              }}
              className="gf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Take New Order
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Orders Table (Desktop) & Card List (Mobile) */}
      <GlassCard className="overflow-hidden p-4 sm:p-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No matching orders found"
            description="Adjust your search or date/status filters, or create a new garment order for DP ENTERPRISES."
            actionLabel="Take New Order"
            onAction={() => {
              setEditingOrderId(null);
              setActiveModule("new-order");
            }}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    {(
                      [
                        ["id", "Order ID"],
                        ["companyName", "Company Name"],
                        [null, "Garment Type"],
                        ["quantity", "Quantity"],
                        ["orderValue", "Order Value"],
                        [null, "Order Cost"],
                        ["expectedProfit", "Expected Profit"],
                        ["orderDate", "Order Date"],
                        ["expectedCompletionDate", "Expected Delivery"],
                        [null, "Status"],
                        [null, "Actions"],
                      ] as [SortField | null, string][]
                    ).map(([field, label]) => (
                      <th key={label} className="pb-3 pr-3 font-semibold whitespace-nowrap">
                        {field ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(field)}
                            className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                          >
                            {label}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {paginated.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-[var(--bg-subtle)]"
                    >
                      <td
                        className={`${
                          compactTables ? "py-2" : "py-3.5"
                        } pr-3 font-bold text-[#8B5CF6] tabular-nums`}
                      >
                        {order.id}
                      </td>
                      <td className="pr-3">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {order.companyName}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {order.contactNumber}
                        </p>
                      </td>
                      <td className="pr-3 text-[var(--text-secondary)]">
                        {order.garmentType}
                      </td>
                      <td className="pr-3 font-medium text-[var(--text-primary)] tabular-nums">
                        {formatNumber(order.quantity)}
                      </td>
                      <td className="pr-3 font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(order.orderValue, currency)}
                      </td>
                      <td className="pr-3 text-[var(--text-secondary)] tabular-nums">
                        {formatCurrency(order.orderCost, currency)}
                      </td>
                      <td
                        className={`pr-3 font-bold tabular-nums ${
                          order.expectedProfit >= 0
                            ? "text-[var(--positive)]"
                            : "text-[#D50000]"
                        }`}
                      >
                        {formatCurrency(order.expectedProfit, currency)}
                      </td>
                      <td className="pr-3 text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="pr-3 text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(order.expectedCompletionDate)}
                      </td>
                      <td className="pr-3">
                        <select
                          aria-label={`Change status for ${order.id}`}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order, e.target.value as OrderStatus)
                          }
                          className="rounded-lg border border-[var(--border-glass)] bg-[var(--input-bg)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] focus:border-[#8B5CF6] focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailOrder(order)}
                            title="View Details"
                            aria-label={`View ${order.id}`}
                            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(order)}
                            title="Edit Order"
                            aria-label={`Edit ${order.id}`}
                            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({ type: "archive", order })
                            }
                            title={order.archived ? "Restore Order" : "Archive Order"}
                            aria-label={`Archive ${order.id}`}
                            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({ type: "delete", order })
                            }
                            title="Delete Order"
                            aria-label={`Delete ${order.id}`}
                            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--rosso-soft)] hover:text-[#D50000]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Card View */}
            <div className="space-y-3 lg:hidden">
              {paginated.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-[#8B5CF6] tabular-nums">
                        {order.id}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {order.companyName}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {order.garmentType} · {formatNumber(order.quantity)} pcs
                      </p>
                    </div>
                    <StatusBadge label={order.status} tone={statusTone(order.status)} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--border-glass)] pt-3 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)]">Value</span>
                      <p className="font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(order.orderValue, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Cost</span>
                      <p className="font-semibold text-[var(--text-secondary)] tabular-nums">
                        {formatCurrency(order.orderCost, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Profit</span>
                      <p
                        className={`font-bold tabular-nums ${
                          order.expectedProfit >= 0
                            ? "text-[var(--positive)]"
                            : "text-[#D50000]"
                        }`}
                      >
                        {formatCurrency(order.expectedProfit, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-glass)] pt-3">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Due {formatDate(order.expectedCompletionDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(order)}
                        className="rounded-lg border border-[var(--border-glass)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(order)}
                        className="rounded-lg border border-[var(--violet-border)] bg-[var(--violet-soft)] px-2.5 py-1 text-xs font-semibold text-[#8B5CF6]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "delete", order })}
                        className="rounded-lg border border-[var(--rosso-border)] bg-[var(--rosso-soft)] px-2.5 py-1 text-xs font-semibold text-[#D50000]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-glass)] pt-4 text-xs text-[var(--text-secondary)]">
              <span>
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[var(--border-glass)] px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-semibold tabular-nums">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-[var(--border-glass)] px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="gf-glass-strong gf-modal-enter w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-start justify-between border-b border-[var(--border-glass)] pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#8B5CF6]">
                  {detailOrder.id}
                </span>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                  {detailOrder.companyName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {detailOrder.garmentType} · {detailOrder.contactNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-sm text-[var(--text-secondary)]">
                {detailOrder.description || "No description provided."}
              </p>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-3.5">
                <div>
                  <span className="text-[var(--text-muted)]">Quantity</span>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {formatNumber(detailOrder.quantity)} pcs
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Pricing Method</span>
                  <p className="font-bold text-[var(--text-primary)]">
                    {detailOrder.pricingMethod === "per-piece"
                      ? `Per-Piece (${formatCurrency(detailOrder.perPieceRate, currency)})`
                      : "Fixed Order Value"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Order Value</span>
                  <p className="font-bold text-[var(--text-primary)] tabular-nums">
                    {formatCurrency(detailOrder.orderValue, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Expected Profit</span>
                  <p className="font-bold text-[var(--positive)] tabular-nums">
                    {formatCurrency(detailOrder.expectedProfit, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Material / Labour / Other</span>
                  <p className="font-semibold text-[var(--text-secondary)] tabular-nums">
                    {formatCurrency(detailOrder.materialCost, currency)} /{" "}
                    {formatCurrency(detailOrder.labourCost, currency)} /{" "}
                    {formatCurrency(detailOrder.otherCosts, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Schedule</span>
                  <p className="font-semibold text-[var(--text-secondary)]">
                    {formatDate(detailOrder.orderDate)} →{" "}
                    {formatDate(detailOrder.expectedCompletionDate)}
                  </p>
                </div>
              </div>
              {detailOrder.notes && (
                <div className="rounded-xl border border-[var(--border-glass)] p-3 text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Notes:</strong>{" "}
                  {detailOrder.notes}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailOrder;
                  setDetailOrder(null);
                  handleEdit(target);
                }}
                className="gf-btn-primary rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === "delete"
            ? `Delete Order ${confirmAction.order.id}?`
            : confirmAction?.order.archived
            ? `Restore Order ${confirmAction.order.id}?`
            : `Archive Order ${confirmAction?.order.id}?`
        }
        description={
          confirmAction?.type === "delete"
            ? "This permanently removes the order record from GarmentFlow."
            : confirmAction?.order.archived
            ? "This restores the order back to the active pipeline."
            : "Archiving hides the order from active metrics while keeping its history."
        }
        confirmLabel={
          confirmAction?.type === "delete"
            ? "Delete Permanently"
            : confirmAction?.order.archived
            ? "Restore"
            : "Archive"
        }
        destructive={confirmAction?.type === "delete"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === "delete") {
            deleteOrder(confirmAction.order.id);
            pushToast({ type: "info", title: `Order ${confirmAction.order.id} deleted` });
          } else {
            const nextArch = !confirmAction.order.archived;
            archiveOrder(confirmAction.order.id, nextArch);
            pushToast({
              type: "info",
              title: `Order ${confirmAction.order.id} ${nextArch ? "archived" : "restored"}`,
            });
          }
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
