"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calculator, Check, Edit3, Trash2, Wallet } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import {
  computeSalaryAmount,
  getWorkerEligibleDaysInMonth,
} from "@/lib/calculations";
import { formatCurrency, formatNumber, getMonthLabel } from "@/lib/format";
import type {
  SalaryRecord,
  SalaryRecordStatus,
  WorkerPaymentType,
} from "@/types/garmentflow";
import {
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

export function SalaryModule() {
  const { state, saveSalaryRecord, deleteSalaryRecord, pushToast } = useGarmentFlow();
  const { currency } = state.settings;
  const now = new Date();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState(state.workers[0]?.id ?? "");
  const [salaryType, setSalaryType] = useState<WorkerPaymentType>(
    state.workers[0]?.paymentType ?? "Monthly Salary"
  );
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [baseRate, setBaseRate] = useState(String(state.workers[0]?.salaryRate ?? 0));
  const [eligibleDays, setEligibleDays] = useState("26");
  const [completedPieces, setCompletedPieces] = useState("0");
  const [extraWages, setExtraWages] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [status, setStatus] = useState<SalaryRecordStatus>("Calculated");
  const [notes, setNotes] = useState("");

  // History filters
  const [filterWorker, setFilterWorker] = useState("All");
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());

  // Sync worker defaults when changing worker (only if not editing an existing record)
  useEffect(() => {
    if (editingId) return;
    const w = state.workers.find((item) => item.id === workerId);
    if (!w) return;
    setSalaryType(w.paymentType);
    setBaseRate(String(w.salaryRate));
    const loggedDays = getWorkerEligibleDaysInMonth(
      w.id,
      month,
      year,
      state.attendance
    );
    if (loggedDays > 0) {
      setEligibleDays(String(loggedDays));
    }
  }, [workerId, month, year, editingId, state.workers, state.attendance]);

  const previewCalculated = useMemo(
    () =>
      computeSalaryAmount({
        salaryType,
        baseRate: Number(baseRate) || 0,
        eligibleDays: Number(eligibleDays) || 0,
        completedPieces: Number(completedPieces) || 0,
        extraWages: Number(extraWages) || 0,
        deductions: Number(deductions) || 0,
      }),
    [salaryType, baseRate, eligibleDays, completedPieces, extraWages, deductions]
  );

  const filteredSalaries = useMemo(() => {
    return state.salaries
      .filter((s) => filterWorker === "All" || s.workerId === filterWorker)
      .filter((s) => s.year === filterYear)
      .filter((s) => filterMonth === "All" || s.month === Number(filterMonth))
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  }, [state.salaries, filterWorker, filterMonth, filterYear]);

  const totalDisplayedSalary = useMemo(
    () => filteredSalaries.reduce((sum, s) => sum + s.calculatedSalary, 0),
    [filteredSalaries]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = saveSalaryRecord({
      id: editingId ?? undefined,
      workerId,
      salaryType,
      month,
      year,
      baseRate: Number(baseRate) || 0,
      eligibleDays: Number(eligibleDays) || 0,
      completedPieces: Number(completedPieces) || 0,
      extraWages: Number(extraWages) || 0,
      deductions: Number(deductions) || 0,
      status,
      notes: notes.trim(),
    });
    if (!res.ok) {
      pushToast({ type: "error", title: "Could not save salary", description: res.error });
      return;
    }
    pushToast({
      type: "success",
      title: editingId ? "Salary record updated" : "Salary calculated & recorded",
      description: `${getMonthLabel(month, year)} · ${formatCurrency(
        previewCalculated,
        currency
      )}`,
    });
    setEditingId(null);
    setExtraWages("0");
    setDeductions("0");
    setNotes("");
  };

  const startEdit = (rec: SalaryRecord) => {
    setEditingId(rec.id);
    setWorkerId(rec.workerId);
    setSalaryType(rec.salaryType);
    setMonth(rec.month);
    setYear(rec.year);
    setBaseRate(String(rec.baseRate));
    setEligibleDays(String(rec.eligibleDays));
    setCompletedPieces(String(rec.completedPieces));
    setExtraWages(String(rec.extraWages));
    setDeductions(String(rec.deductions));
    setStatus(rec.status);
    setNotes(rec.notes);
  };

  return (
    <div className="space-y-5">
      {/* Scope Notice + Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Filtered Salary Records
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {filteredSalaries.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Calculated Payroll
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {formatCurrency(totalDisplayedSalary, currency)}
          </p>
        </GlassCard>
        <GlassCard className="flex items-center p-4">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Record-Keeping Mode:</strong>{" "}
            Calculates Monthly, Daily-Wage, and Per-Piece entitlements. No bank or
            payment transfers are initiated here.
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Calculator Form */}
        <GlassCard className="p-5 xl:col-span-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-glass)] pb-3">
            <Calculator className="h-4 w-4 text-[#8B5CF6]" />
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              {editingId ? "Edit Salary Record" : "Calculate Worker Salary"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className={LABEL_CLASS}>Worker</label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className={INPUT_CLASS}
              >
                {state.workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.paymentType})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Salary Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className={INPUT_CLASS}
                >
                  {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                    <option key={m} value={m}>
                      {getMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Salary Type</label>
                <select
                  value={salaryType}
                  onChange={(e) =>
                    setSalaryType(e.target.value as WorkerPaymentType)
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Monthly Salary">Monthly Salary</option>
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Per-Piece Wage">Per-Piece Wage</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Base Rate ({currency})</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            </div>

            {salaryType === "Daily Wage" && (
              <div>
                <label className={LABEL_CLASS}>Eligible Working Days</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={eligibleDays}
                  onChange={(e) => setEligibleDays(e.target.value)}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            )}

            {salaryType === "Per-Piece Wage" && (
              <div>
                <label className={LABEL_CLASS}>Completed Pieces</label>
                <input
                  type="number"
                  min={0}
                  value={completedPieces}
                  onChange={(e) => setCompletedPieces(e.target.value)}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Extra Wages (+)</label>
                <input
                  type="number"
                  min={0}
                  value={extraWages}
                  onChange={(e) => setExtraWages(e.target.value)}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Deductions (−)</label>
                <input
                  type="number"
                  min={0}
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Record Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SalaryRecordStatus)}
                className={INPUT_CLASS}
              >
                <option value="Calculated">Calculated</option>
                <option value="Approved">Approved</option>
                <option value="Recorded">Recorded</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Overtime bonus, advance recovery..."
                className={INPUT_CLASS}
              />
            </div>

            {/* Live Formula Preview */}
            <div className="rounded-xl border border-[var(--violet-border)] bg-[var(--violet-soft)] p-3.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Calculated Salary</span>
                <span className="text-[11px]">
                  {salaryType === "Monthly Salary"
                    ? "Rate + Extra − Ded."
                    : salaryType === "Daily Wage"
                    ? "Days × Rate + Extra − Ded."
                    : "Pieces × Rate + Extra − Ded."}
                </span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
                {formatCurrency(previewCalculated, currency)}
              </p>
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-xl border border-[var(--border-glass)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={state.workers.length === 0}
                className="gf-btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Update Salary Record" : "Save Salary Record"}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Salary History Table */}
        <GlassCard className="p-5 xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                Salary History & Monthly Records
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Filter by worker, month, and year
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                aria-label="Filter salary by worker"
                className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
              >
                <option value="All">All Workers</option>
                {state.workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                aria-label="Filter salary by month"
                className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
              >
                <option value="All">All Months</option>
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                aria-label="Filter salary by year"
                className={`${INPUT_CLASS} w-24 py-1.5 text-xs tabular-nums`}
              />
            </div>
          </div>

          {filteredSalaries.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No salary records found"
              description="Calculate and save a worker's salary for the selected period on the left."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                    <th className="pb-2.5 pr-3 font-semibold">Worker</th>
                    <th className="pb-2.5 pr-3 font-semibold">Type</th>
                    <th className="pb-2.5 pr-3 font-semibold">Month</th>
                    <th className="pb-2.5 pr-3 font-semibold">Base Rate</th>
                    <th className="pb-2.5 pr-3 font-semibold">Days / Pcs</th>
                    <th className="pb-2.5 pr-3 font-semibold">Extra / Ded.</th>
                    <th className="pb-2.5 pr-3 font-semibold">Calculated</th>
                    <th className="pb-2.5 pr-3 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-glass)]">
                  {filteredSalaries.map((sal) => (
                    <tr key={sal.id} className="hover:bg-[var(--bg-subtle)]">
                      <td className="py-2.5 pr-3 font-bold text-[var(--text-primary)]">
                        {sal.workerName}
                      </td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
                        {sal.salaryType}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {getMonthLabel(sal.month, sal.year)}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {formatCurrency(sal.baseRate, currency)}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {sal.salaryType === "Per-Piece Wage"
                          ? `${formatNumber(sal.completedPieces)} pcs`
                          : sal.salaryType === "Daily Wage"
                          ? `${sal.eligibleDays} days`
                          : "Monthly"}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        +{formatCurrency(sal.extraWages, currency)} / −
                        {formatCurrency(sal.deductions, currency)}
                      </td>
                      <td className="py-2.5 pr-3 font-extrabold text-[#8B5CF6] tabular-nums">
                        {formatCurrency(sal.calculatedSalary, currency)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge
                          label={sal.status}
                          tone={sal.status === "Recorded" ? "positive" : "violet"}
                        />
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(sal)}
                          aria-label="Edit salary record"
                          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSalaryRecord(sal.id);
                            pushToast({ type: "info", title: "Salary record deleted" });
                          }}
                          aria-label="Delete salary record"
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
      </div>
    </div>
  );
}
