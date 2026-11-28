"use client";

import React from "react";

interface BrandLogoProps {
  compact?: boolean;
}

/**
 * Custom DP ENTERPRISES monogram combining geometric D + P letterforms
 * with a crisp Electric Violet lockstitch thread seam & needle eye.
 */
export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[#17171D] shadow-sm">
        <svg
          viewBox="0 0 40 40"
          className="h-8 w-8"
          fill="none"
          aria-hidden="true"
        >
          {/* Subtle garment seam stitch border */}
          <rect
            x="3"
            y="3"
            width="34"
            height="34"
            rx="8"
            stroke="#8B5CF6"
            strokeOpacity="0.45"
            strokeWidth="1.2"
            strokeDasharray="3 2.5"
          />
          {/* Geometric D */}
          <path
            d="M10 11.5H15.2C18.8 11.5 21.2 14.1 21.2 20C21.2 25.9 18.8 28.5 15.2 28.5H10V11.5Z"
            stroke="#F5F5F0"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Geometric P */}
          <path
            d="M22.8 28.5V11.5H27.4C30.1 11.5 31.8 13.1 31.8 15.8C31.8 18.5 30.1 20.1 27.4 20.1H22.8"
            stroke="#F5F5F0"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Thread seam & needle eye bridging D and P */}
          <path
            d="M8.5 20H31.5"
            stroke="#8B5CF6"
            strokeWidth="1.6"
            strokeDasharray="2.4 2"
            strokeLinecap="round"
          />
          <circle cx="31.5" cy="20" r="1.8" fill="#8B5CF6" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)]">
              GARMENTFLOW
            </span>
          </div>
          <p className="truncate text-[10px] font-semibold tracking-[0.16em] text-[#8B5CF6] uppercase">
            DP ENTERPRISES
          </p>
        </div>
      )}
    </div>
  );
}
