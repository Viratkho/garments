"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export function AnimatedNumber({
  value,
  formatter,
  animate = true,
}: {
  value: number;
  formatter: (v: number) => string;
  animate?: boolean;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) {
      setDisplay(value);
      return;
    }
    const duration = 380;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + diff * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animate]);

  return <span className="tabular-nums">{formatter(display)}</span>;
}

export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`gf-glass rounded-2xl transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "violet" | "rosso" | "positive" | "neutral";
}) {
  const styles = {
    violet:
      "bg-[var(--violet-soft)] text-[#8B5CF6] border-[var(--violet-border)]",
    rosso:
      "bg-[var(--rosso-soft)] text-[#D50000] border-[var(--rosso-border)]",
    positive:
      "bg-[var(--positive-soft)] text-[var(--positive)] border-[var(--positive-border)]",
    neutral:
      "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-glass)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor:
            tone === "violet"
              ? "#8B5CF6"
              : tone === "rosso"
              ? "#D50000"
              : tone === "positive"
              ? "var(--positive)"
              : "var(--text-muted)",
        }}
      />
      {label}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="gf-glass-strong gf-modal-enter w-full max-w-md rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              destructive
                ? "border-[var(--rosso-border)] bg-[var(--rosso-soft)] text-[#D50000]"
                : "border-[var(--violet-border)] bg-[var(--violet-soft)] text-[#8B5CF6]"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-title"
              className="text-base font-bold text-[var(--text-primary)]"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-[#F5F5F0] transition active:scale-95 ${
              destructive
                ? "bg-[#D50000] hover:bg-[#b80000]"
                : "gf-btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; type: "success" | "error" | "info"; title: string; description?: string }[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-2 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="gf-glass-strong gf-modal-enter flex items-start gap-3 rounded-2xl p-3.5 shadow-xl"
        >
          <div className="mt-0.5 shrink-0">
            {t.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-[var(--positive)]" />
            )}
            {t.type === "error" && (
              <AlertTriangle className="h-5 w-5 text-[#D50000]" />
            )}
            {t.type === "info" && <Info className="h-5 w-5 text-[#8B5CF6]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t.title}
            </p>
            {t.description && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {t.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--violet-border)] bg-[var(--violet-soft)] text-[#8B5CF6]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[var(--text-secondary)]">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="gf-btn-primary mt-5 rounded-xl px-4 py-2 text-sm font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--border-glass)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25";

export const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]";
