"use client";

import React, { useId, useRef, useState } from "react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { runInkThemeTransition } from "@/lib/inkTransition";

export function ThemeToggle() {
  const { state, updateSettings } = useGarmentFlow();
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const maskId = useId();
  const isDark = state.settings.theme === "dark";

  const handleToggle = () => {
    if (busy) return;
    const nextTheme = isDark ? "light" : "dark";
    runInkThemeTransition({
      nextTheme,
      originEl: btnRef.current,
      applyTheme: (theme) => updateSettings({ theme }),
      onBusy: setBusy,
    });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-busy={busy}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode (Ink Pour)" : "Switch to Dark Mode (Ink Pour)"}
      onClick={handleToggle}
      className="ink-toggle"
    >
      <span className="ink-tg-pill" aria-hidden="true">
        <span className="ink-tg-gloss" />
        <span className="ink-tg-dot" />
        <span className="ink-tg-knob">
          <svg viewBox="0 0 32 32">
            <defs>
              <mask id={maskId}>
                <rect width="32" height="32" fill="#fff" />
                <circle
                  className="ink-tg-bite"
                  cx="22.5"
                  cy="10"
                  r="8.6"
                  fill="#000"
                />
              </mask>
            </defs>
            <g
              className="ink-tg-rays"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M16 2.6v3.2M16 26.2v3.2M2.6 16h3.2M26.2 16h3.2M6.5 6.5l2.3 2.3M23.2 23.2l2.3 2.3M6.5 25.5l2.3-2.3M23.2 8.8l2.3-2.3" />
            </g>
            <circle
              className="ink-tg-disc"
              cx="16"
              cy="16"
              r="10.4"
              fill="currentColor"
              mask={`url(#${maskId})`}
            />
          </svg>
        </span>
      </span>
    </button>
  );
}
