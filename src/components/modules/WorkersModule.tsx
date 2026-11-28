"use client";

import React, { useMemo, useState } from "react";
import { Edit3, Eye, Plus, Search, UserCheck, Users, UserX, X } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { formatCurrency, formatDate, getMonthLabel, toISODate } from "@/lib/format";
import type { Worker, WorkerPaymentType, WorkerStatus } from "@/types/garmentflow";
import {
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const PAYMENT_TYPES: WorkerPaymentType[] = [
  "Monthly Salary",
  "Daily Wage",
  "Per-Piece Wage",
];

const emptyWorkerForm = () => ({
  name: "",
  phone: "",
  address: "",
  joiningDate: toISODate(new Date()),
  paymentType: "Daily Wage" as WorkerPaymentType,
  salaryRate: "",
  status: "Active" as WorkerStatus,
  role: "",
  notes: "",
});

export function WorkersModule() {
  const {
    state,
    globalSearch,
    addWorker,
    updateWorker,
    toggleWorkerStatus,
    pushToast,
  } = useGarmentFlow();
  const { currency } = state.settings;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkerStatus>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState(emptyWorkerForm);
  const [profileWorker, setProfileWorker] = useState<Worker | null>(null);
  const [profileTab, setProfileTab] = useState<"attendance" | "salary">("attendance");

  const q = (search || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return state.workers
      .filter((w) => statusFilter === "All" || w.status === statusFilter)
      .filter((w) => {
        if (!q) return true;
        return (
          w.name.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q) ||
          w.role.toLowerCase().includes(q) ||
          w.paymentType.toLowerCase().includes(q)
        );
      });
  }, [state.workers, statusFilter, q]);

  const activeCount = state.workers.filter((w) => w.status === "Active").length;
  const inactiveCount = state.workers.length - activeCount;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyWorkerForm());
    setModalOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setForm({
      name: w.name,
      phone: w.phone,
      address: w.address,
      joiningDate: w.joiningDate,
      paymentType: w.paymentType,
      salaryRate: String(w.salaryRate),
      status: w.status,
      role: w.role,
      notes: w.notes,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      joiningDate: form.joiningDate,
      paymentType: form.paymentType,
      salaryRate: Number(form.salaryRate),
      status: form.status,
      role: form.role.trim() || "Floor Tailor",
      notes: form.notes.trim(),
    };

    if (editing) {
      const res = updateWorker(editing.id, payload);
      if (res.ok) {
        pushToast({ type: "success", title: `${payload.name} updated` });
        setModalOpen(false);
      } else {
        pushToast({ type: "error", title: "Validation error", description: res.error });
      }
      return;
    }

    const res = addWorker(payload);
    if (res.ok) {
      pushToast({ type: "success", title: `${payload.name} added to workforce` });
      setModalOpen(false);
    } else {
      pushToast({ type: "error", title: "Validation error", description: res.error });
    }
  };

  const profileAttendance = useMemo(() => {
    if (!profileWorker) return [];
    return state.attendance
      .filter((a) => a.workerId === profileWorker.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [profileWorker, state.attendance]);

  const profileSalaries = useMemo(() => {
    if (!profileWorker) return [];
    return state.salaries
      .filter((s) => s.workerId === profileWorker.id)
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  }, [profileWorker, state.salaries]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Workforce
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {state.workers.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Active Workers
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--positive)] tabular-nums">
            {activeCount}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Inactive Workers
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-muted)] tabular-nums">
            {inactiveCount}
          </p>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worker, phone, role..."
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "All" | WorkerStatus)
              }
              aria-label="Filter workers by status"
              className={`${INPUT_CLASS} w-auto`}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="gf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Worker
          </button>
        </div>
      </GlassCard>

      {/* Workers Table */}
      <GlassCard className="p-4 sm:p-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No workers match your filters"
            description="Add tailors, cutting leads, overlock operators, and floor staff."
            actionLabel="Add Worker"
            onAction={openAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                  <th className="pb-3 pr-3 font-semibold">Worker</th>
                  <th className="pb-3 pr-3 font-semibold">Phone</th>
                  <th className="pb-3 pr-3 font-semibold">Joining Date</th>
                  <th className="pb-3 pr-3 font-semibold">Payment Type</th>
                  <th className="pb-3 pr-3 font-semibold">Rate</th>
                  <th className="pb-3 pr-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-glass)]">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--bg-subtle)]">
                    <td className="py-3 pr-3">
                      <p className="font-bold text-[var(--text-primary)]">{w.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {w.id} · {w.role}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-[var(--text-secondary)] tabular-nums">
                      {w.phone}
                    </td>
                    <td className="py-3 pr-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(w.joiningDate)}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge label={w.paymentType} tone="violet" />
                    </td>
                    <td className="py-3 pr-3 font-bold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(w.salaryRate, currency)}
                      <span className="font-normal text-[var(--text-muted)]">
                        {w.paymentType === "Monthly Salary"
                          ? "/mo"
                          : w.paymentType === "Daily Wage"
                          ? "/day"
                          : "/pc"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge
                        label={w.status}
                        tone={w.status === "Active" ? "positive" : "neutral"}
                      />
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileWorker(w);
                            setProfileTab("attendance");
                          }}
                          title="View Profile & History"
                          aria-label={`View profile for ${w.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(w)}
                          title="Edit Worker"
                          aria-label={`Edit ${w.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggleWorkerStatus(w.id);
                            pushToast({
                              type: "info",
                              title: `${w.name} marked ${
                                w.status === "Active" ? "Inactive" : "Active"
                              }`,
                            });
                          }}
                          title={w.status === "Active" ? "Deactivate" : "Activate"}
                          aria-label={`Toggle status for ${w.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                        >
                          {w.status === "Active" ? (
                            <UserX className="h-4 w-4 text-[#D50000]" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-[var(--positive)]" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Worker Profile Modal (with Attendance History & Salary History) */}
      {profileWorker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="gf-glass-strong gf-modal-enter max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6">
            <div className="flex items-start justify-between border-b border-[var(--border-glass)] pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#8B5CF6]">
                  {profileWorker.id} · {profileWorker.role}
                </span>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                  {profileWorker.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {profileWorker.phone} · {profileWorker.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileWorker(null)}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-3.5 text-xs sm:grid-cols-4">
              <div>
                <span className="text-[var(--text-muted)]">Payment Model</span>
                <p className="font-bold text-[var(--text-primary)]">
                  {profileWorker.paymentType}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Salary Rate</span>
                <p className="font-bold text-[#8B5CF6] tabular-nums">
                  {formatCurrency(profileWorker.salaryRate, currency)}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Joined</span>
                <p className="font-semibold text-[var(--text-primary)]">
                  {formatDate(profileWorker.joiningDate)}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Status</span>
                <div className="mt-0.5">
                  <StatusBadge
                    label={profileWorker.status}
                    tone={profileWorker.status === "Active" ? "positive" : "neutral"}
                  />
                </div>
              </div>
            </div>

            {profileWorker.notes && (
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">Notes:</strong>{" "}
                {profileWorker.notes}
              </p>
            )}

            <div className="mt-5 flex gap-2 border-b border-[var(--border-glass)] pb-2">
              <button
                type="button"
                onClick={() => setProfileTab("attendance")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  profileTab === "attendance"
                    ? "bg-[#8B5CF6] text-[#F5F5F0]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                Attendance History ({profileAttendance.length})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("salary")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  profileTab === "salary"
                    ? "bg-[#8B5CF6] text-[#F5F5F0]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                Salary History ({profileSalaries.length})
              </button>
            </div>

            <div className="mt-4">
              {profileTab === "attendance" ? (
                profileAttendance.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                    No attendance logs recorded for this worker yet.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Check-In</th>
                        <th className="pb-2">Check-Out</th>
                        <th className="pb-2">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-glass)]">
                      {profileAttendance.map((att) => (
                        <tr key={att.id}>
                          <td className="py-2">{formatDate(att.date)}</td>
                          <td className="py-2">
                            <StatusBadge
                              label={att.status}
                              tone={
                                att.status === "Present"
                                  ? "positive"
                                  : att.status === "Half-Day"
                                  ? "violet"
                                  : att.status === "Absent"
                                  ? "rosso"
                                  : "neutral"
                              }
                            />
                          </td>
                          <td className="py-2 tabular-nums">{att.checkIn || "—"}</td>
                          <td className="py-2 tabular-nums">{att.checkOut || "—"}</td>
                          <td className="py-2 font-semibold tabular-nums">
                            {att.workingHours}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : profileSalaries.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                  No salary calculations recorded for this worker yet.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                      <th className="pb-2">Period</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Extra / Ded.</th>
                      <th className="pb-2">Calculated</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-glass)]">
                    {profileSalaries.map((sal) => (
                      <tr key={sal.id}>
                        <td className="py-2 font-semibold">
                          {getMonthLabel(sal.month, sal.year)}
                        </td>
                        <td className="py-2">{sal.salaryType}</td>
                        <td className="py-2 tabular-nums">
                          +{formatCurrency(sal.extraWages, currency)} / −
                          {formatCurrency(sal.deductions, currency)}
                        </td>
                        <td className="py-2 font-bold text-[#8B5CF6] tabular-nums">
                          {formatCurrency(sal.calculatedSalary, currency)}
                        </td>
                        <td className="py-2">
                          <StatusBadge label={sal.status} tone="positive" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="gf-glass-strong gf-modal-enter w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {editing ? `Edit ${editing.name}` : "Add New Worker"}
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
                  <label className={LABEL_CLASS}>Worker Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>Role / Specialization</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g., Collar Tailor"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Joining Date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLASS}>Payment Type</label>
                  <select
                    value={form.paymentType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentType: e.target.value as WorkerPaymentType,
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Salary Rate ({currency}) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.salaryRate}
                    onChange={(e) => setForm({ ...form, salaryRate: e.target.value })}
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as WorkerStatus })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  {editing ? "Update Worker" : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
