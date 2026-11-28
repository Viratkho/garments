"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Menu,
  PieChart,
  Receipt,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import { computeDashboardSummary } from "@/lib/calculations";
import { toISODate } from "@/lib/format";
import type { ModuleId } from "@/types/garmentflow";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { StatusBadge, ToastContainer } from "./ui/GlassPrimitives";

const MODULE_META: Record<ModuleId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Operations Dashboard",
    subtitle: "Live manufacturing, inventory, workforce & financial overview",
  },
  "new-order": {
    title: "Take New Order",
    subtitle: "Capture bulk garment, collar, pocket & combined manufacturing orders",
  },
  "all-orders": {
    title: "All Orders",
    subtitle: "Search, track, edit, sort & manage company order pipelines",
  },
  inventory: {
    title: "Inventory Management",
    subtitle: "Raw fabrics, threads, trims, packaging & stock valuations",
  },
  stock: {
    title: "Stock Management",
    subtitle: "Record stock in, stock out, order consumption, wastage & adjustments",
  },
  workers: {
    title: "Worker Management",
    subtitle: "Workforce directory, payment models, attendance & salary history",
  },
  attendance: {
    title: "Worker Attendance",
    subtitle: "Daily check-in/out logs, working hours & monthly attendance view",
  },
  salary: {
    title: "Worker Salary Management",
    subtitle: "Monthly, daily-wage & per-piece salary calculations and records",
  },
  expenses: {
    title: "Business Expenses",
    subtitle: "Electricity, rent, transport, maintenance & general factory overheads",
  },
  earnings: {
    title: "Monthly Earnings",
    subtitle: "Realized revenue from completed orders vs. active pipeline",
  },
  "profit-loss": {
    title: "Profit and Loss",
    subtitle: "Audited business P&L without double-counting materials or labour",
  },
  settings: {
    title: "Settings & Customization",
    subtitle: "Business profile, currency, theme, background & data controls",
  },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    state,
    activeModule,
    setActiveModule,
    setEditingOrderId,
    globalSearch,
    setGlobalSearch,
    toasts,
    dismissToast,
    clearSampleData,
  } = useGarmentFlow();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const summary = useMemo(
    () => computeDashboardSummary(state, toISODate(new Date())),
    [state]
  );

  const alertCount = summary.lowStockCount + summary.pendingOrders;

  const navigate = (mod: ModuleId) => {
    if (mod !== "new-order") {
      setEditingOrderId(null);
    }
    setActiveModule(mod);
    setMobileOpen(false);
    setNotifOpen(false);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    if (
      activeModule !== "all-orders" &&
      activeModule !== "inventory" &&
      activeModule !== "workers" &&
      activeModule !== "expenses"
    ) {
      setActiveModule("all-orders");
    }
  };

  const navItemClass = (isActive: boolean) =>
    `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
      isActive
        ? "bg-[#8B5CF6] text-[#F5F5F0] shadow-[0_8px_20px_-8px_rgba(139,92,246,0.75)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
    }`;

  const renderNavContent = (isMobile = false) => {
    const compact = !isMobile && sidebarCollapsed;
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] px-4 py-4">
          <BrandLogo compact={compact} />
          {!isMobile ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--violet-border)] hover:text-[var(--text-primary)] lg:flex"
            >
              {compact ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-glass)] text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => navigate("dashboard")}
            className={navItemClass(activeModule === "dashboard")}
            title="Dashboard"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!compact && <span>Dashboard</span>}
          </button>

          {/* 2. Orders Group */}
          <div className="space-y-1">
            {!compact ? (
              <>
                <button
                  type="button"
                  onClick={() => setOrdersExpanded((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  aria-expanded={ordersExpanded}
                >
                  <span className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    <span>Orders</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      ordersExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {ordersExpanded && (
                  <div className="ml-4 space-y-1 border-l border-[var(--border-glass)] pl-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrderId(null);
                        navigate("new-order");
                      }}
                      className={navItemClass(activeModule === "new-order")}
                    >
                      <FilePlus2 className="h-4 w-4 shrink-0" />
                      <span>Take New Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("all-orders")}
                      className={navItemClass(activeModule === "all-orders")}
                    >
                      <ClipboardList className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">All Orders</span>
                      <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] tabular-nums">
                        {summary.totalOrders}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("new-order")}
                  className={navItemClass(activeModule === "new-order")}
                  title="Take New Order"
                >
                  <FilePlus2 className="h-4 w-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("all-orders")}
                  className={navItemClass(activeModule === "all-orders")}
                  title="All Orders"
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                </button>
              </>
            )}
          </div>

          {/* 3. Inventory Management */}
          <button
            type="button"
            onClick={() => navigate("inventory")}
            className={navItemClass(activeModule === "inventory")}
            title="Inventory Management"
          >
            <Boxes className="h-4 w-4 shrink-0" />
            {!compact && (
              <>
                <span className="flex-1 text-left">Inventory Management</span>
                {summary.lowStockCount > 0 && (
                  <span className="rounded-full bg-[#D50000] px-1.5 py-0.5 text-[10px] font-bold text-[#F5F5F0] tabular-nums">
                    {summary.lowStockCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* 4. Stock Management */}
          <button
            type="button"
            onClick={() => navigate("stock")}
            className={navItemClass(activeModule === "stock")}
            title="Stock Management"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            {!compact && <span>Stock Management</span>}
          </button>

          {/* 5. Worker Management */}
          <button
            type="button"
            onClick={() => navigate("workers")}
            className={navItemClass(activeModule === "workers")}
            title="Worker Management"
          >
            <Users className="h-4 w-4 shrink-0" />
            {!compact && <span>Worker Management</span>}
          </button>

          {/* 6. Worker Attendance */}
          <button
            type="button"
            onClick={() => navigate("attendance")}
            className={navItemClass(activeModule === "attendance")}
            title="Worker Attendance"
          >
            <CalendarCheck2 className="h-4 w-4 shrink-0" />
            {!compact && <span>Worker Attendance</span>}
          </button>

          {/* 7. Worker Salary */}
          <button
            type="button"
            onClick={() => navigate("salary")}
            className={navItemClass(activeModule === "salary")}
            title="Worker Salary"
          >
            <Wallet className="h-4 w-4 shrink-0" />
            {!compact && <span>Worker Salary</span>}
          </button>

          {/* 8. Expenses */}
          <button
            type="button"
            onClick={() => navigate("expenses")}
            className={navItemClass(activeModule === "expenses")}
            title="Expenses"
          >
            <Receipt className="h-4 w-4 shrink-0" />
            {!compact && <span>Expenses</span>}
          </button>

          {/* 9. Monthly Earnings */}
          <button
            type="button"
            onClick={() => navigate("earnings")}
            className={navItemClass(activeModule === "earnings")}
            title="Monthly Earnings"
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            {!compact && <span>Monthly Earnings</span>}
          </button>

          {/* 10. Profit and Loss */}
          <button
            type="button"
            onClick={() => navigate("profit-loss")}
            className={navItemClass(activeModule === "profit-loss")}
            title="Profit and Loss"
          >
            <PieChart className="h-4 w-4 shrink-0" />
            {!compact && <span>Profit and Loss</span>}
          </button>

          {/* 11. Settings */}
          <button
            type="button"
            onClick={() => navigate("settings")}
            className={navItemClass(activeModule === "settings")}
            title="Settings"
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!compact && <span>Settings</span>}
          </button>
        </nav>

        {!compact && (
          <div className="border-t border-[var(--border-glass)] p-3.5">
            <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[11px] font-bold tracking-wider text-[#8B5CF6] uppercase">
                {state.settings.businessName}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                Internal Operations Suite
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const meta = MODULE_META[activeModule];

  return (
    <div className="relative min-h-screen">
      {/* Dynamic 7-style background canvas */}
      <div className="gf-bg-layer" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={`gf-glass-strong hidden shrink-0 border-r border-[var(--border-glass)] transition-all duration-200 lg:sticky lg:top-0 lg:block lg:h-screen ${
            sidebarCollapsed ? "w-[76px]" : "w-[264px]"
          }`}
        >
          {renderNavContent(false)}
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="gf-glass-strong relative z-10 h-full w-[276px] border-r border-[var(--border-glass)]">
              {renderNavContent(true)}
            </aside>
          </div>
        )}

        {/* Main workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navigation Bar */}
          <header className="gf-glass-strong sticky top-0 z-30 border-b border-[var(--border-glass)] px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-primary)] lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-sm font-extrabold tracking-tight text-[var(--text-primary)] sm:text-lg">
                      {meta.title}
                    </h1>
                    <span className="hidden rounded-md border border-[var(--violet-border)] bg-[var(--violet-soft)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#8B5CF6] uppercase xl:inline-block">
                      GARMENTFLOW
                    </span>
                  </div>
                  <p className="hidden truncate text-xs text-[var(--text-secondary)] sm:block">
                    {meta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search */}
                <form
                  onSubmit={handleGlobalSearchSubmit}
                  className="relative hidden md:block"
                >
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="search"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search orders, materials, workers..."
                    aria-label="Global quick search"
                    className="w-52 rounded-xl border border-[var(--border-glass)] bg-[var(--input-bg)] py-2 pr-3 pl-9 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:w-64 focus:border-[#8B5CF6] focus:outline-none lg:w-60"
                  />
                </form>

                {/* Notifications */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label="Open operational alerts"
                    aria-expanded={notifOpen}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] text-[var(--text-primary)] transition hover:border-[var(--violet-border)]"
                  >
                    <Bell className="h-4 w-4" />
                    {alertCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D50000] px-1 text-[10px] font-bold text-[#F5F5F0] tabular-nums">
                        {alertCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="gf-glass-strong gf-modal-enter absolute right-0 z-50 mt-2 w-80 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2.5">
                        <span className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                          Operational Alerts
                        </span>
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          Close
                        </button>
                      </div>
                      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                        {summary.lowStockMaterials.map((mat) => (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => navigate("inventory")}
                            className="flex w-full items-center justify-between rounded-xl border border-[var(--rosso-border)] bg-[var(--rosso-soft)] px-3 py-2 text-left transition hover:opacity-90"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                                Low Stock: {mat.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                {mat.availableQuantity} {mat.unit} left (min{" "}
                                {mat.minimumStockLevel})
                              </p>
                            </div>
                            <StatusBadge label="Restock" tone="rosso" />
                          </button>
                        ))}
                        {summary.pendingOrders > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate("all-orders")}
                            className="flex w-full items-center justify-between rounded-xl border border-[var(--violet-border)] bg-[var(--violet-soft)] px-3 py-2 text-left transition hover:opacity-90"
                          >
                            <div>
                              <p className="text-xs font-bold text-[var(--text-primary)]">
                                {summary.pendingOrders} Pending Order
                                {summary.pendingOrders > 1 ? "s" : ""}
                              </p>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                Awaiting production line scheduling
                              </p>
                            </div>
                            <StatusBadge label="Review" tone="violet" />
                          </button>
                        )}
                        {alertCount === 0 && (
                          <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                            All stock levels and order queues look healthy.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ink-Spread Theme Toggle */}
                <ThemeToggle />

                {/* Profile Badge */}
                <button
                  type="button"
                  onClick={() => navigate("settings")}
                  className="hidden items-center gap-2.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-2.5 py-1.5 text-left transition hover:border-[var(--violet-border)] sm:flex"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6] text-xs font-extrabold text-[#F5F5F0]">
                    DP
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {state.settings.businessName}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Operations Admin
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Active Module Content */}
          <main
            key={activeModule}
            className="gf-module-enter mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6"
          >
            {/* Optional Sample Data Notice */}
            {state.hasSampleData && state.settings.showSampleBanner && (
              <div className="mb-5 rounded-2xl border border-[var(--violet-border)] bg-[var(--violet-soft)] px-4 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="text-[var(--text-primary)]">
                    <strong className="font-bold text-[#8B5CF6]">Demo Dataset Active:</strong>{" "}
                    Preloaded sample records help demonstrate live metrics for DP ENTERPRISES.
                  </p>
                  <button
                    type="button"
                    onClick={clearSampleData}
                    className="rounded-lg border border-[var(--violet-border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[#8B5CF6] hover:text-[#F5F5F0]"
                  >
                    Remove Sample Records
                  </button>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
