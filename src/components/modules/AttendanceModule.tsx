"use client";

import React, { useMemo, useState } from "react";
import { CalendarCheck2, Check, Edit3, Trash2 } from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { getYearMonth } from "@/lib/calculations";
import {
  calculateWorkingHours,
  formatDate,
  getMonthLabel,
  toISODate,
} from "@/lib/format";
import type { AttendanceRecord, AttendanceStatus } from "@/types/garmentflow";
import { InteractiveDonutChart } from "@/components/charts/GarmentCharts";
import {
  EmptyState,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
  StatusBadge,
} from "@/components/ui/GlassPrimitives";

const STATUSES: AttendanceStatus[] = ["Present", "Absent", "Half-Day", "Leave"];

export function AttendanceModule() {
  const { state, saveAttendance, deleteAttendance, pushToast } = useGarmentFlow();

  const today = toISODate(new Date());
  const nowDate = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [filterMonth, setFilterMonth] = useState(nowDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(nowDate.getFullYear());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState(state.workers[0]?.id ?? "");
  const [status, setStatus] = useState<AttendanceStatus>("Present");
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");
  const [notes, setNotes] = useState("");

  const previewHours = useMemo(() => {
    if (status === "Absent" || status === "Leave") return 0;
    return calculateWorkingHours(checkIn, checkOut);
  }, [status, checkIn, checkOut]);

  const dailyRecords = useMemo(() => {
    return state.attendance.filter((a) => a.date === selectedDate);
  }, [state.attendance, selectedDate]);

  const dailyStats = useMemo(() => {
    const activeWorkers = state.workers.filter((w) => w.status === "Active");
    const present = dailyRecords.filter((a) => a.status === "Present").length;
    const halfDay = dailyRecords.filter((a) => a.status === "Half-Day").length;
    const absent = dailyRecords.filter((a) => a.status === "Absent").length;
    const leave = dailyRecords.filter((a) => a.status === "Leave").length;
    return {
      totalWorkers: activeWorkers.length,
      present,
      halfDay,
      absent,
      leave,
    };
  }, [state.workers, dailyRecords]);

  const monthlySummary = useMemo(() => {
    return state.workers.map((w) => {
      const logs = state.attendance.filter((a) => {
        if (a.workerId !== w.id) return false;
        const ym = getYearMonth(a.date);
        return ym?.year === filterYear && ym?.month === filterMonth;
      });
      const present = logs.filter((l) => l.status === "Present").length;
      const halfDay = logs.filter((l) => l.status === "Half-Day").length;
      const absent = logs.filter((l) => l.status === "Absent").length;
      const leave = logs.filter((l) => l.status === "Leave").length;
      const hours =
        Math.round(logs.reduce((s, l) => s + l.workingHours, 0) * 100) / 100;
      return { worker: w, present, halfDay, absent, leave, hours, totalLogs: logs.length };
    });
  }, [state.workers, state.attendance, filterMonth, filterYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = workerId || state.workers[0]?.id || "";
    const res = saveAttendance({
      id: editingId ?? undefined,
      workerId: targetWorker,
      date: selectedDate,
      status,
      checkIn: status === "Absent" || status === "Leave" ? "" : checkIn,
      checkOut: status === "Absent" || status === "Leave" ? "" : checkOut,
      notes: notes.trim(),
    });
    if (!res.ok) {
      pushToast({ type: "error", title: "Could not save attendance", description: res.error });
      return;
    }
    const wName =
      state.workers.find((w) => w.id === targetWorker)?.name ?? "Worker";
    pushToast({
      type: "success",
      title: editingId ? "Attendance updated" : "Attendance marked",
      description: `${wName} · ${status} (${formatDate(selectedDate)})`,
    });
    setEditingId(null);
    setNotes("");
  };

  const startEdit = (rec: AttendanceRecord) => {
    setEditingId(rec.id);
    setWorkerId(rec.workerId);
    setSelectedDate(rec.date);
    setStatus(rec.status);
    setCheckIn(rec.checkIn || "09:00");
    setCheckOut(rec.checkOut || "18:00");
    setNotes(rec.notes);
  };

  return (
    <div className="space-y-5">
      {/* Daily Attendance Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Active Workers
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {dailyStats.totalWorkers}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Present Workers
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--positive)] tabular-nums">
            {dailyStats.present}{" "}
            {dailyStats.halfDay > 0 && (
              <span className="text-xs font-semibold text-[#8B5CF6]">
                +{dailyStats.halfDay} half
              </span>
            )}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Absent Workers
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[#D50000] tabular-nums">
            {dailyStats.absent}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Workers on Leave
          </span>
          <p className="mt-1.5 text-2xl font-extrabold text-[var(--text-secondary)] tabular-nums">
            {dailyStats.leave}
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Mark Daily Attendance Form */}
        <GlassCard className="p-5 xl:col-span-4">
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">
            {editingId ? "Edit Attendance Entry" : "Mark Daily Attendance"}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Working hours compute automatically from check-in & check-out times.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Attendance Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Select Worker</label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className={INPUT_CLASS}
              >
                {state.workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      status === st
                        ? "border-[#8B5CF6] bg-[var(--violet-soft)] text-[#8B5CF6]"
                        : "border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {(status === "Present" || status === "Half-Day") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Check-In Time</label>
                  <input
                    type="time"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Check-Out Time</label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="text-[var(--text-secondary)]">Calculated Working Hours</span>
              <span className="font-extrabold text-[#8B5CF6] tabular-nums">
                {previewHours} hrs
              </span>
            </div>

            <div>
              <label className={LABEL_CLASS}>Attendance Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift details, overtime, reason..."
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setNotes("");
                  }}
                  className="rounded-xl border border-[var(--border-glass)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={state.workers.length === 0}
                className="gf-btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {editingId ? "Update Attendance" : "Save Attendance"}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Daily / Monthly Attendance Views + Chart */}
        <div className="space-y-5 xl:col-span-8">
          <GlassCard className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("daily")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    viewMode === "daily"
                      ? "bg-[#8B5CF6] text-[#F5F5F0]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Daily Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("monthly")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    viewMode === "monthly"
                      ? "bg-[#8B5CF6] text-[#F5F5F0]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Monthly Attendance
                </button>
              </div>

              {viewMode === "daily" ? (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Select date for daily attendance"
                  className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
                />
              ) : (
                <div className="flex gap-2">
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className={`${INPUT_CLASS} w-auto py-1.5 text-xs`}
                  >
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
                    className={`${INPUT_CLASS} w-24 py-1.5 text-xs tabular-nums`}
                  />
                </div>
              )}
            </div>

            {viewMode === "daily" ? (
              dailyRecords.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck2}
                  title={`No attendance logged for ${formatDate(selectedDate)}`}
                  description="Use the form on the left to record check-in/out and attendance status."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                        <th className="pb-2.5 pr-3 font-semibold">Worker</th>
                        <th className="pb-2.5 pr-3 font-semibold">Status</th>
                        <th className="pb-2.5 pr-3 font-semibold">Check-In</th>
                        <th className="pb-2.5 pr-3 font-semibold">Check-Out</th>
                        <th className="pb-2.5 pr-3 font-semibold">Hours</th>
                        <th className="pb-2.5 pr-3 font-semibold">Notes</th>
                        <th className="pb-2.5 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-glass)]">
                      {dailyRecords.map((rec) => {
                        const w = state.workers.find((item) => item.id === rec.workerId);
                        return (
                          <tr key={rec.id} className="hover:bg-[var(--bg-subtle)]">
                            <td className="py-2.5 pr-3 font-bold text-[var(--text-primary)]">
                              {w?.name ?? rec.workerId}
                            </td>
                            <td className="py-2.5 pr-3">
                              <StatusBadge
                                label={rec.status}
                                tone={
                                  rec.status === "Present"
                                    ? "positive"
                                    : rec.status === "Half-Day"
                                    ? "violet"
                                    : rec.status === "Absent"
                                    ? "rosso"
                                    : "neutral"
                                }
                              />
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums">
                              {rec.checkIn || "—"}
                            </td>
                            <td className="py-2.5 pr-3 tabular-nums">
                              {rec.checkOut || "—"}
                            </td>
                            <td className="py-2.5 pr-3 font-bold tabular-nums">
                              {rec.workingHours}h
                            </td>
                            <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
                              {rec.notes || "—"}
                            </td>
                            <td className="py-2.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => startEdit(rec)}
                                aria-label="Edit attendance record"
                                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--violet-soft)] hover:text-[#8B5CF6]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteAttendance(rec.id);
                                  pushToast({ type: "info", title: "Attendance record removed" });
                                }}
                                aria-label="Delete attendance record"
                                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--rosso-soft)] hover:text-[#D50000]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-glass)] text-[var(--text-muted)]">
                      <th className="pb-2.5 pr-3 font-semibold">Worker</th>
                      <th className="pb-2.5 pr-3 font-semibold">Present</th>
                      <th className="pb-2.5 pr-3 font-semibold">Half-Day</th>
                      <th className="pb-2.5 pr-3 font-semibold">Leave</th>
                      <th className="pb-2.5 pr-3 font-semibold">Absent</th>
                      <th className="pb-2.5 font-semibold">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-glass)]">
                    {monthlySummary.map((row) => (
                      <tr key={row.worker.id} className="hover:bg-[var(--bg-subtle)]">
                        <td className="py-2.5 pr-3 font-bold text-[var(--text-primary)]">
                          {row.worker.name}
                        </td>
                        <td className="py-2.5 pr-3 font-bold text-[var(--positive)] tabular-nums">
                          {row.present}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-[#8B5CF6] tabular-nums">
                          {row.halfDay}
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)] tabular-nums">
                          {row.leave}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-[#D50000] tabular-nums">
                          {row.absent}
                        </td>
                        <td className="py-2.5 font-bold text-[var(--text-primary)] tabular-nums">
                          {row.hours} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Daily Attendance Breakdown Chart */}
          <GlassCard className="p-5">
            <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
              Attendance Distribution ({formatDate(selectedDate)})
            </h3>
            <InteractiveDonutChart
              centerLabel="Logged"
              centerValue={dailyRecords.length}
              segments={[
                { label: "Present", value: dailyStats.present, color: "#22C55E" },
                { label: "Half-Day", value: dailyStats.halfDay, color: "#8B5CF6" },
                { label: "Leave", value: dailyStats.leave, color: "#9CA3AF" },
                { label: "Absent", value: dailyStats.absent, color: "#D50000" },
              ]}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
