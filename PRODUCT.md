# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js (App Router), React, TypeScript, and Tailwind CSS, targeting Vercel deployment (fast, mobile-responsive internal operations web application with zero external paid dependencies and local browser persistence plus exportable CSV/JSON data).

## Users

Operations managers, production supervisors, and business owners at **DP ENTERPRISES**, managing daily bulk garment manufacturing and stitching operations across desktop workstations and mobile devices.

## Product Purpose

**GARMENTFLOW** is the internal garment manufacturing management system for **DP ENTERPRISES**. It unifies bulk order intake, order tracking, raw material inventory, stock movements, worker rosters, daily attendance, salary calculation, general expenses, monthly realized earnings, and profit/loss analysis in one coherent system.

## Positioning

Purpose-built for B2B bulk garment stitching and material-supply operations (bulk stitching, collar/pocket stitching, custom designs, stitching-only, and combined material + stitching orders), calculating real profitability without double-counting material consumption or worker labour costs—and without payment gateways or e-commerce bloat.

## Operating Context

- Internal operations system for DP ENTERPRISES (not a customer-facing storefront or payment gateway).
- Tracks B2B bulk garment orders with per-piece or fixed-price contracts, material/labour/other costs, and expected profit.
- Realized revenue counts **Completed** orders only; Pending and In-Progress orders are tracked separately as pipeline.
- Stock movements (Stock In, Stock Out, Order Consumption, Wastage, Stock Adjustment) automatically update inventory quantities and prevent accidental negative stock.
- Worker compensation covers Monthly Salary, Daily Wage, and Per-Piece Wage calculation and record-keeping only (no payment transfers).
- Optional realistic sample demonstration dataset included with one-click clear/reset.

## Capabilities and Constraints

- 12 integrated modules: Dashboard, Take New Order, All Orders, Inventory Management, Stock Management, Worker Management, Worker Attendance, Worker Salary Management, Expenses, Monthly Earnings, Profit and Loss, and Settings.
- Completely free and open-source frontend architecture; no paid APIs, paid icon sets, or paid animation libraries.
- Currency defaults to INR (`₹`), configurable in Settings.
- All dashboard metrics, charts, and P&L figures calculate dynamically from live application records.
- Respects `prefers-reduced-motion` and works cleanly across desktop, tablet, and mobile viewports.

## Brand Commitments

- **Application Name:** GARMENTFLOW
- **Business Name:** DP ENTERPRISES
- **Logo:** Custom monogram combining **DP** with subtle garment/thread/stitching geometry.
- **Exact Brand Palette:** Midnight Black (`#0B0B0F`), Carbon Black (`#17171D`), Electric Violet (`#8B5CF6`), Pearl White (`#F5F5F0`), Rosso Corsa (`#D50000`).
- **Visual System:** Glassmorphism panels over customizable backgrounds (7 selectable styles), complete Dark/Light mode with ink-spread transition originating from the theme toggle.

## Evidence on Hand

- Optional initial demonstration data (clearly labeled as sample records and removable from Settings or top banner).
- User-supplied `ink-theme-source` MIT reference for the ink-spread theme transition mechanics.

## Product Principles

1. **Single source of operational truth:** Every order, stock movement, attendance entry, salary record, and expense updates downstream summaries immediately.
2. **Financial integrity without double-counting:** Realized revenue includes only Completed orders; P&L explicitly guards against double-counting order-attributed material/labour costs against stock consumption or salary ledgers.
3. **Industrial clarity in both themes:** Crisp tabular numerals, disciplined Electric Violet highlights, and Rosso Corsa critical warnings remain legible across every glass surface and background preset.
4. **Zero dead controls:** Every button, filter, sort, search bar, modal, form validation, export, and theme control performs real work.
