"use client";

import React, { useRef, useState } from "react";
import {
  Check,
  Download,
  Info,
  Palette,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useGarmentFlow } from "@/context/GarmentFlowContext";
import type { BackgroundStyleId, CurrencyCode } from "@/types/garmentflow";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ConfirmDialog,
  GlassCard,
  INPUT_CLASS,
  LABEL_CLASS,
} from "@/components/ui/GlassPrimitives";

const BACKGROUND_STYLES: {
  id: BackgroundStyleId;
  label: string;
  desc: string;
  swatch: string;
}[] = [
  {
    id: "midnight-solid",
    label: "Midnight Black Solid",
    desc: "Deep #0B0B0F solid surface",
    swatch: "#0B0B0F",
  },
  {
    id: "carbon-solid",
    label: "Carbon Black Solid",
    desc: "Rich #17171D studio matte",
    swatch: "#17171D",
  },
  {
    id: "pearl-solid",
    label: "Pearl White Solid",
    desc: "Clean #F5F5F0 daylight neutral",
    swatch: "#F5F5F0",
  },
  {
    id: "subtle-violet",
    label: "Subtle Violet Gradient",
    desc: "Soft Electric Violet corner bloom",
    swatch: "radial-gradient(circle at 25% 25%, #8B5CF6, #0B0B0F 75%)",
  },
  {
    id: "dark-radial",
    label: "Dark Radial Gradient",
    desc: "Architectural top spotlight",
    swatch: "radial-gradient(circle at 50% 0%, #272736, #0B0B0F 80%)",
  },
  {
    id: "soft-mesh",
    label: "Soft Mesh Gradient",
    desc: "Layered Violet & subtle Crimson mesh",
    swatch:
      "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.7), transparent 60%), radial-gradient(circle at 80% 80%, rgba(213,0,0,0.45), #0B0B0F)",
  },
  {
    id: "minimal-glass",
    label: "Minimal Glass Background",
    desc: "Clean frosted architectural sheen",
    swatch: "linear-gradient(180deg, rgba(245,245,240,0.14) 0%, #17171D 100%)",
  },
];

export function SettingsModule() {
  const {
    state,
    updateSettings,
    clearSampleData,
    clearAllData,
    resetDemoData,
    importBackupJson,
    pushToast,
  } = useGarmentFlow();

  const [businessName, setBusinessName] = useState(state.settings.businessName);
  const [contactPhone, setContactPhone] = useState(state.settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(state.settings.contactEmail);
  const [address, setAddress] = useState(state.settings.address);
  const [currency, setCurrency] = useState<CurrencyCode>(state.settings.currency);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName: businessName.trim() || "DP ENTERPRISES",
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      address: address.trim(),
      currency,
    });
    pushToast({
      type: "success",
      title: "Business settings saved",
      description: `Active currency: ${currency}`,
    });
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `garmentflow-dp-enterprises-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: "info", title: "Full JSON backup exported" });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJson(String(reader.result ?? ""));
      if (res.ok) {
        pushToast({ type: "success", title: "Backup restored successfully" });
      } else {
        pushToast({ type: "error", title: "Import failed", description: res.error });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Business Profile & Currency */}
        <GlassCard className="p-5 sm:p-6 xl:col-span-6">
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">
            Business Profile & Currency
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Configure DP ENTERPRISES details and reporting currency.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Business Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Currency Selection</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className={INPUT_CLASS}
              >
                <option value="INR">INR (₹) — Indian Rupee (Default)</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>

            <button
              type="submit"
              className="gf-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold"
            >
              <Check className="h-4 w-4" />
              Save Business Settings
            </button>
          </form>
        </GlassCard>

        {/* Theme & Visual Customization */}
        <GlassCard className="p-5 sm:p-6 xl:col-span-6">
          <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                Theme & Ink Transition
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Switch between Midnight Black dark mode and Pearl White light mode.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#8B5CF6]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Background Style Customization
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {BACKGROUND_STYLES.map((bg) => {
                const active = state.settings.backgroundStyle === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      updateSettings({ backgroundStyle: bg.id });
                      pushToast({
                        type: "info",
                        title: `Background: ${bg.label}`,
                      });
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#8B5CF6] bg-[var(--violet-soft)]"
                        : "border-[var(--border-glass)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-[var(--border-strong)]"
                      style={{ background: bg.swatch, backgroundSize: "12px 12px" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                        {bg.label}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-secondary)]">
                        {bg.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashboard Preferences */}
          <div className="mt-5 space-y-2.5 border-t border-[var(--border-glass)] pt-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Dashboard & Interface Preferences
            </h3>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                Animate Dashboard KPI Count-Up
              </span>
              <input
                type="checkbox"
                checked={state.settings.animateNumbers}
                onChange={(e) =>
                  updateSettings({ animateNumbers: e.target.checked })
                }
                className="h-4 w-4 accent-[#8B5CF6]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                Compact Table Row Density
              </span>
              <input
                type="checkbox"
                checked={state.settings.compactTables}
                onChange={(e) =>
                  updateSettings({ compactTables: e.target.checked })
                }
                className="h-4 w-4 accent-[#8B5CF6]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                Show Demo Dataset Banner (when sample data is active)
              </span>
              <input
                type="checkbox"
                checked={state.settings.showSampleBanner}
                onChange={(e) =>
                  updateSettings({ showSampleBanner: e.target.checked })
                }
                className="h-4 w-4 accent-[#8B5CF6]"
              />
            </label>
          </div>
        </GlassCard>
      </div>

      {/* Data Management & Application Info */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">
            Data Backup & Sample Records
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Export/restore local records or remove demonstration data before live entry.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--violet-border)]"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON Backup
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--violet-border)]"
            >
              <Upload className="h-3.5 w-3.5" />
              Import Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />

            {state.hasSampleData && (
              <button
                type="button"
                onClick={clearSampleData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--violet-border)] bg-[var(--violet-soft)] px-3.5 py-2 text-xs font-semibold text-[#8B5CF6]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Sample Records
              </button>
            )}

            <button
              type="button"
              onClick={resetDemoData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Load Demo Dataset
            </button>

            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--rosso-border)] bg-[var(--rosso-soft)] px-3.5 py-2 text-xs font-semibold text-[#D50000]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All Data
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#8B5CF6]" />
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              Application Information
            </h2>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-[var(--text-muted)]">Application</dt>
              <dd className="font-bold text-[var(--text-primary)]">GARMENTFLOW v1.0</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Organization</dt>
              <dd className="font-bold text-[var(--text-primary)]">
                {state.settings.businessName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Storage Mode</dt>
              <dd className="font-semibold text-[var(--text-secondary)]">
                Browser Local Persistence (Zero Paid APIs)
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Modules Active</dt>
              <dd className="font-semibold text-[#8B5CF6]">12 / 12 Operational</dd>
            </div>
          </dl>
        </GlassCard>
      </div>

      <ConfirmDialog
        open={confirmClearAll}
        title="Clear all workspace data?"
        description="This deletes all orders, materials, stock movements, workers, attendance, salaries, and expenses from this browser. Export a JSON backup first if needed."
        confirmLabel="Clear Everything"
        destructive
        onCancel={() => setConfirmClearAll(false)}
        onConfirm={() => {
          clearAllData();
          setConfirmClearAll(false);
        }}
      />
    </div>
  );
}
