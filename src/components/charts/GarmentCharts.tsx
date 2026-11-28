"use client";

import React, { useState } from "react";
import type { CurrencyCode } from "@/types/garmentflow";
import { formatCurrency, formatNumber } from "@/lib/format";

export interface SeriesDatum {
  label: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
}

/**
 * Interactive Grouped / Single Vertical Bar Chart with hover tooltip and brand palette.
 */
export function InteractiveBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  primaryColor = "#8B5CF6",
  secondaryColor = "#D50000",
  negativeColor = "#D50000",
  currency,
  height = 230,
}: {
  data: SeriesDatum[];
  primaryLabel: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  negativeColor?: string;
  currency?: CurrencyCode;
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const hasNegative = data.some(
    (d) => d.primary < 0 || (d.secondary ?? 0) < 0
  );
  const maxPos = Math.max(
    1,
    ...data.flatMap((d) => [Math.max(0, d.primary), Math.max(0, d.secondary ?? 0)])
  );
  const maxNeg = Math.max(
    0,
    ...data.flatMap((d) => [
      Math.max(0, -d.primary),
      Math.max(0, -(d.secondary ?? 0)),
    ])
  );
  const totalRange = maxPos + maxNeg;
  const posAreaPct = hasNegative ? (maxPos / totalRange) * 100 : 100;
  const negAreaPct = hasNegative ? (maxNeg / totalRange) * 100 : 0;

  const fmt = (v: number) => (currency ? formatCurrency(v, currency) : formatNumber(v));

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            />
            {primaryLabel}
          </span>
          {secondaryLabel && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: secondaryColor }}
              />
              {secondaryLabel}
            </span>
          )}
          {hasNegative && !secondaryLabel && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: negativeColor }}
              />
              Loss
            </span>
          )}
        </div>
        {hovered !== null && data[hovered] && (
          <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-sm tabular-nums">
            {data[hovered].label}: {fmt(data[hovered].primary)}
            {secondaryLabel !== undefined && data[hovered].secondary !== undefined
              ? ` · ${secondaryLabel}: ${fmt(data[hovered].secondary ?? 0)}`
              : ""}
          </div>
        )}
      </div>

      <div
        className="relative flex items-stretch justify-between gap-2 border-b border-[var(--border-glass)] pt-4 pb-1"
        style={{ height }}
      >
        {/* Horizontal reference lines */}
        <div className="pointer-events-none absolute inset-x-0 top-4 bottom-1 flex flex-col justify-between">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full border-t border-dashed border-[var(--border-glass)]"
            />
          ))}
        </div>

        {/* Zero baseline when negative values exist */}
        {hasNegative && (
          <div
            className="pointer-events-none absolute inset-x-0 z-0 border-t border-[var(--border-strong)]"
            style={{ top: `calc(1rem + (100% - 1.25rem) * ${posAreaPct / 100})` }}
          />
        )}

        {data.map((item, i) => {
          const isActive = hovered === i;
          const pIsNeg = item.primary < 0;
          const pColor = pIsNeg ? negativeColor : primaryColor;
          const pPosH =
            !pIsNeg && item.primary > 0
              ? Math.max(4, (item.primary / maxPos) * 100)
              : item.primary === 0
              ? 2
              : 0;
          const pNegH =
            pIsNeg && maxNeg > 0
              ? Math.max(6, (Math.abs(item.primary) / maxNeg) * 100)
              : 0;

          const sVal = item.secondary ?? 0;
          const sPosH =
            secondaryLabel && item.secondary !== undefined && sVal >= 0
              ? sVal === 0
                ? 2
                : Math.max(4, (sVal / maxPos) * 100)
              : 0;

          return (
            <div
              key={item.label + i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="img"
              aria-label={`${item.label}: ${primaryLabel} ${fmt(item.primary)}${
                secondaryLabel ? `, ${secondaryLabel} ${fmt(item.secondary ?? 0)}` : ""
              }`}
              className={`group relative z-10 flex h-full flex-1 flex-col items-center rounded-lg px-1 transition focus:outline-none ${
                isActive ? "bg-[var(--bg-subtle)]" : ""
              }`}
            >
              {/* Positive zone */}
              <div
                className="flex w-full max-w-[44px] items-end justify-center gap-1"
                style={{ height: `${posAreaPct}%` }}
              >
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${pPosH}%`,
                    backgroundColor: pColor,
                    opacity: hovered !== null && !isActive ? 0.55 : 1,
                  }}
                />
                {secondaryLabel && item.secondary !== undefined && (
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${sPosH}%`,
                      backgroundColor: secondaryColor,
                      opacity: hovered !== null && !isActive ? 0.55 : 0.9,
                    }}
                  />
                )}
              </div>

              {/* Negative (Loss) zone */}
              {hasNegative && (
                <div
                  className="flex w-full max-w-[44px] items-start justify-center gap-1"
                  style={{ height: `${negAreaPct}%` }}
                >
                  <div
                    className="w-full rounded-b-md transition-all duration-300"
                    style={{
                      height: `${pNegH}%`,
                      backgroundColor: negativeColor,
                      opacity: hovered !== null && !isActive ? 0.55 : 1,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-[var(--text-muted)]">
        {data.map((item, i) => (
          <div key={item.label + i} className="flex-1 truncate text-center">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Interactive Area / Line Chart for Revenue & Profit Trends
 */
export function InteractiveAreaChart({
  data,
  currency,
  accentColor = "#8B5CF6",
  negativeColor = "#D50000",
  valueLabel = "Value",
  height = 210,
}: {
  data: { label: string; value: number }[];
  currency?: CurrencyCode;
  accentColor?: string;
  negativeColor?: string;
  valueLabel?: string;
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gradId = React.useId();

  const values = data.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1, ...values);
  const span = Math.max(1, maxVal - minVal);

  const W = 560;
  const H = 180;
  const padX = 24;
  const padY = 18;
  const plotW = W - padX * 2;
  const plotH = H - padY * 2;

  const coords = data.map((d, i) => {
    const x =
      data.length <= 1 ? W / 2 : padX + (i / (data.length - 1)) * plotW;
    const y = padY + ((maxVal - d.value) / span) * plotH;
    return { x, y, ...d };
  });

  const zeroY = padY + ((maxVal - 0) / span) * plotH;

  const linePath = coords
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`
      : "";

  const fmt = (v: number) => (currency ? formatCurrency(v, currency) : formatNumber(v));

  return (
    <div className="w-full">
      <div className="mb-2 flex min-h-6 items-center justify-between text-xs">
        <span className="font-medium text-[var(--text-secondary)]">
          {valueLabel}
        </span>
        {hovered !== null && coords[hovered] && (
          <span
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated-strong)] px-2.5 py-0.5 font-semibold tabular-nums"
            style={{
              color:
                coords[hovered].value < 0 ? negativeColor : "var(--text-primary)",
            }}
          >
            {coords[hovered].label}: {fmt(coords[hovered].value)}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height }}
        role="img"
        aria-label={valueLabel}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line
          x1={padX}
          y1={zeroY}
          x2={W - padX}
          y2={zeroY}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
        />

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((pt, i) => {
          const isNeg = pt.value < 0;
          const isActive = hovered === i;
          return (
            <g
              key={pt.label + i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 6.5 : 4.2}
                fill={isNeg ? negativeColor : accentColor}
                stroke="var(--bg-base)"
                strokeWidth="2"
              />
              <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
              <text
                x={pt.x}
                y={H - 2}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted)"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Interactive Donut Distribution Chart
 */
export function InteractiveDonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth="18"
          />
          {total > 0 &&
            segments.map((seg, i) => {
              const val = Math.max(0, seg.value);
              const pct = val / total;
              const dash = pct * circumference;
              const gap = circumference - dash;
              const offset = -cumulative * circumference;
              cumulative += pct;
              const isActive = hovered === i;
              return (
                <circle
                  key={seg.label}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isActive ? 21 : 18}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    opacity: hovered !== null && !isActive ? 0.55 : 1,
                  }}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-[var(--text-primary)] tabular-nums">
            {hovered !== null && segments[hovered]
              ? segments[hovered].value
              : centerValue}
          </span>
          <span className="max-w-[84px] truncate text-[11px] font-medium text-[var(--text-muted)]">
            {hovered !== null && segments[hovered]
              ? segments[hovered].label
              : centerLabel}
          </span>
        </div>
      </div>

      <div className="grid w-full flex-1 grid-cols-1 gap-2">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <button
              key={seg.label}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                hovered === i
                  ? "border-[var(--violet-border)] bg-[var(--bg-hover)]"
                  : "border-[var(--border-glass)] bg-[var(--bg-subtle)]"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.label}
              </span>
              <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
                {seg.value} ({pct}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Horizontal Category Breakdown Bars
 */
export function HorizontalCategoryBars({
  items,
  currency,
  accentColor = "#8B5CF6",
}: {
  items: { label: string; value: number; color?: string }[];
  currency?: CurrencyCode;
  accentColor?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = (v: number) => (currency ? formatCurrency(v, currency) : formatNumber(v));

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--text-muted)]">
        No category data available for this selection.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.max(4, Math.round((item.value / max) * 100));
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                {item.label}
              </span>
              <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
                {fmt(item.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color ?? accentColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
