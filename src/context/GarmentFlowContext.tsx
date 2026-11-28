"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { computeOrderFinancials, computeSalaryAmount } from "@/lib/calculations";
import { calculateWorkingHours, toISODate } from "@/lib/format";
import { createSampleState, DEFAULT_SETTINGS } from "@/lib/seedData";
import type {
  AttendanceRecord,
  BusinessSettings,
  ExpenseRecord,
  GarmentFlowState,
  MaterialItem,
  ModuleId,
  Order,
  SalaryRecord,
  StockMovement,
  StockMovementType,
  ToastMessage,
  Worker,
} from "@/types/garmentflow";

const STORAGE_KEY = "garmentflow.dp.v1.state";
const THEME_KEY = "garmentflow.dp.v1.theme";

interface RecordMovementInput {
  materialId: string;
  movementType: StockMovementType;
  quantity: number;
  adjustmentDirection?: "increase" | "decrease";
  date: string;
  reason: string;
  relatedOrderId?: string;
  notes: string;
}

interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

interface GarmentFlowContextValue {
  state: GarmentFlowState;
  hydrated: boolean;
  activeModule: ModuleId;
  setActiveModule: (mod: ModuleId) => void;
  editingOrderId: string | null;
  setEditingOrderId: (id: string | null) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;

  // Orders
  addOrder: (
    input: Omit<Order, "id" | "orderValue" | "orderCost" | "expectedProfit">
  ) => ActionResult;
  updateOrder: (
    id: string,
    input: Partial<Omit<Order, "id" | "orderValue" | "orderCost" | "expectedProfit">>
  ) => ActionResult;
  deleteOrder: (id: string) => void;
  archiveOrder: (id: string, archived?: boolean) => void;

  // Inventory
  addMaterial: (input: Omit<MaterialItem, "id">) => ActionResult;
  updateMaterial: (id: string, input: Partial<Omit<MaterialItem, "id">>) => ActionResult;
  deleteMaterial: (id: string) => ActionResult;

  // Stock Movements
  recordStockMovement: (input: RecordMovementInput) => ActionResult;

  // Workers
  addWorker: (input: Omit<Worker, "id">) => ActionResult;
  updateWorker: (id: string, input: Partial<Omit<Worker, "id">>) => ActionResult;
  toggleWorkerStatus: (id: string) => void;

  // Attendance
  saveAttendance: (
    input: Omit<AttendanceRecord, "id" | "workingHours"> & { id?: string }
  ) => ActionResult;
  deleteAttendance: (id: string) => void;

  // Salaries
  saveSalaryRecord: (
    input: Omit<SalaryRecord, "id" | "calculatedSalary" | "workerName"> & { id?: string }
  ) => ActionResult;
  deleteSalaryRecord: (id: string) => void;

  // Expenses
  addExpense: (input: Omit<ExpenseRecord, "id">) => ActionResult;
  updateExpense: (id: string, input: Partial<Omit<ExpenseRecord, "id">>) => ActionResult;
  deleteExpense: (id: string) => void;

  // Settings & Data management
  updateSettings: (patch: Partial<BusinessSettings>) => void;
  clearSampleData: () => void;
  clearAllData: () => void;
  resetDemoData: () => void;
  importBackupJson: (raw: string) => ActionResult;
}

const GarmentFlowContext = createContext<GarmentFlowContextValue | null>(null);

function nextPrefixedId(prefix: string, existingIds: string[], startNum: number): string {
  let max = startNum - 1;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const id of existingIds) {
    const m = re.exec(id);
    if (m) {
      const n = Number(m[1]);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${max + 1}`;
}

export function GarmentFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GarmentFlowState>(() => createSampleState());
  const [hydrated, setHydrated] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GarmentFlowState>;
        if (parsed && Array.isArray(parsed.orders)) {
          setState((prev) => ({
            ...prev,
            ...parsed,
            settings: {
              ...DEFAULT_SETTINGS,
              ...(parsed.settings ?? {}),
              theme:
                savedTheme === "dark" || savedTheme === "light"
                  ? savedTheme
                  : parsed.settings?.theme ?? DEFAULT_SETTINGS.theme,
            },
          }));
        }
      } else if (savedTheme === "dark" || savedTheme === "light") {
        setState((prev) => ({
          ...prev,
          settings: { ...prev.settings, theme: savedTheme },
        }));
      }
    } catch {
      // Fallback to initial sample state
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage & sync DOM theme attributes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(THEME_KEY, state.settings.theme);
    } catch {
      // Ignore storage quota errors
    }
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.dataset.bg = state.settings.backgroundStyle;
    const dark = state.settings.theme === "dark";
    const colorScheme = document.querySelector('meta[name="color-scheme"]');
    if (colorScheme) colorScheme.setAttribute("content", dark ? "dark" : "light");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", dark ? "#0B0B0F" : "#F5F5F0");
  }, [state, hydrated]);

  // Orders
  const addOrder = useCallback(
    (
      input: Omit<Order, "id" | "orderValue" | "orderCost" | "expectedProfit">
    ): ActionResult => {
      if (!input.companyName.trim()) {
        return { ok: false, error: "Company / Customer Name is required." };
      }
      if (input.quantity <= 0) {
        return { ok: false, error: "Order quantity must be greater than zero." };
      }
      if (input.pricingMethod === "per-piece" && input.perPieceRate <= 0) {
        return { ok: false, error: "Per-piece rate must be greater than zero." };
      }
      if (input.pricingMethod === "fixed" && input.fixedOrderValue <= 0) {
        return { ok: false, error: "Fixed order value must be greater than zero." };
      }
      const financials = computeOrderFinancials(input);
      let createdId = "";
      setState((prev) => {
        createdId = nextPrefixedId(
          "GF",
          prev.orders.map((o) => o.id),
          1047
        );
        const newOrder: Order = {
          ...input,
          id: createdId,
          ...financials,
          orderDate: input.orderDate || toISODate(new Date()),
        };
        return {
          ...prev,
          orders: [newOrder, ...prev.orders],
        };
      });
      return { ok: true, id: createdId };
    },
    []
  );

  const updateOrder = useCallback(
    (
      id: string,
      input: Partial<Omit<Order, "id" | "orderValue" | "orderCost" | "expectedProfit">>
    ): ActionResult => {
      let found = false;
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => {
          if (o.id !== id) return o;
          found = true;
          const merged = { ...o, ...input };
          return {
            ...merged,
            ...computeOrderFinancials(merged),
          };
        }),
      }));
      return found ? { ok: true, id } : { ok: false, error: "Order not found." };
    },
    []
  );

  const deleteOrder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== id),
    }));
  }, []);

  const archiveOrder = useCallback((id: string, archived = true) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, archived } : o)),
    }));
  }, []);

  // Inventory
  const addMaterial = useCallback((input: Omit<MaterialItem, "id">): ActionResult => {
    if (!input.name.trim()) {
      return { ok: false, error: "Material name is required." };
    }
    if (input.availableQuantity < 0 || input.minimumStockLevel < 0 || input.unitCost < 0) {
      return { ok: false, error: "Quantities and unit cost cannot be negative." };
    }
    let createdId = "";
    setState((prev) => {
      createdId = nextPrefixedId(
        "MAT",
        prev.materials.map((m) => m.id),
        10
      );
      return {
        ...prev,
        materials: [{ ...input, id: createdId }, ...prev.materials],
      };
    });
    return { ok: true, id: createdId };
  }, []);

  const updateMaterial = useCallback(
    (id: string, input: Partial<Omit<MaterialItem, "id">>): ActionResult => {
      if (input.availableQuantity !== undefined && input.availableQuantity < 0) {
        return { ok: false, error: "Available quantity cannot be negative." };
      }
      setState((prev) => ({
        ...prev,
        materials: prev.materials.map((m) => (m.id === id ? { ...m, ...input } : m)),
      }));
      return { ok: true, id };
    },
    []
  );

  const deleteMaterial = useCallback((id: string): ActionResult => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }));
    return { ok: true, id };
  }, []);

  // Stock Movements (atomic inventory sync + negative stock prevention)
  const recordStockMovement = useCallback(
    (input: RecordMovementInput): ActionResult => {
      const qty = Number(input.quantity);
      if (!input.materialId) {
        return { ok: false, error: "Please select a material." };
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return { ok: false, error: "Quantity must be greater than zero." };
      }
      const target = state.materials.find((m) => m.id === input.materialId);
      if (!target) {
        return { ok: false, error: "Selected material was not found." };
      }

      let delta = qty;
      if (
        input.movementType === "Stock Out" ||
        input.movementType === "Order Consumption" ||
        input.movementType === "Wastage"
      ) {
        delta = -qty;
      } else if (input.movementType === "Stock Adjustment") {
        delta = input.adjustmentDirection === "decrease" ? -qty : qty;
      }

      const resultingQty = Math.round((target.availableQuantity + delta) * 100) / 100;
      if (resultingQty < 0) {
        return {
          ok: false,
          error: `Insufficient stock for ${target.name}. Available: ${target.availableQuantity} ${target.unit}, attempted deduction: ${qty} ${target.unit}.`,
        };
      }

      const newId = nextPrefixedId(
        "STK",
        state.stockMovements.map((s) => s.id),
        507
      );

      setState((prev) => ({
        ...prev,
        materials: prev.materials.map((m) =>
          m.id === target.id ? { ...m, availableQuantity: resultingQty } : m
        ),
        stockMovements: [
          {
            id: newId,
            materialId: target.id,
            materialName: target.name,
            movementType: input.movementType,
            delta,
            quantity: qty,
            date: input.date || toISODate(new Date()),
            reason: input.reason.trim() || input.movementType,
            relatedOrderId: input.relatedOrderId || undefined,
            notes: input.notes.trim(),
          },
          ...prev.stockMovements,
        ],
      }));

      return { ok: true, id: newId };
    },
    [state.materials, state.stockMovements]
  );

  // Workers
  const addWorker = useCallback((input: Omit<Worker, "id">): ActionResult => {
    if (!input.name.trim()) return { ok: false, error: "Worker name is required." };
    if (!input.phone.trim()) return { ok: false, error: "Phone number is required." };
    if (input.salaryRate <= 0) return { ok: false, error: "Salary rate must be positive." };

    let createdId = "";
    setState((prev) => {
      createdId = nextPrefixedId(
        "WRK",
        prev.workers.map((w) => w.id),
        9
      );
      return {
        ...prev,
        workers: [{ ...input, id: createdId }, ...prev.workers],
      };
    });
    return { ok: true, id: createdId };
  }, []);

  const updateWorker = useCallback(
    (id: string, input: Partial<Omit<Worker, "id">>): ActionResult => {
      setState((prev) => ({
        ...prev,
        workers: prev.workers.map((w) => (w.id === id ? { ...w, ...input } : w)),
      }));
      return { ok: true, id };
    },
    []
  );

  const toggleWorkerStatus = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      workers: prev.workers.map((w) =>
        w.id === id
          ? { ...w, status: w.status === "Active" ? "Inactive" : "Active" }
          : w
      ),
    }));
  }, []);

  // Attendance
  const saveAttendance = useCallback(
    (
      input: Omit<AttendanceRecord, "id" | "workingHours"> & { id?: string }
    ): ActionResult => {
      if (!input.workerId) return { ok: false, error: "Please select a worker." };
      if (!input.date) return { ok: false, error: "Please select an attendance date." };

      const workingHours =
        input.status === "Absent" || input.status === "Leave"
          ? 0
          : calculateWorkingHours(input.checkIn, input.checkOut);

      let savedId = input.id ?? "";
      setState((prev) => {
        const existingIndex = prev.attendance.findIndex(
          (a) =>
            (input.id && a.id === input.id) ||
            (!input.id && a.workerId === input.workerId && a.date === input.date)
        );
        if (existingIndex >= 0) {
          const existing = prev.attendance[existingIndex];
          savedId = existing.id;
          const updated: AttendanceRecord = {
            ...existing,
            ...input,
            id: existing.id,
            workingHours,
          };
          const next = [...prev.attendance];
          next[existingIndex] = updated;
          return { ...prev, attendance: next };
        }
        savedId = nextPrefixedId(
          "ATT",
          prev.attendance.map((a) => a.id),
          108
        );
        return {
          ...prev,
          attendance: [
            { ...input, id: savedId, workingHours },
            ...prev.attendance,
          ],
        };
      });
      return { ok: true, id: savedId };
    },
    []
  );

  const deleteAttendance = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      attendance: prev.attendance.filter((a) => a.id !== id),
    }));
  }, []);

  // Salaries (record-keeping & calculation only)
  const saveSalaryRecord = useCallback(
    (
      input: Omit<SalaryRecord, "id" | "calculatedSalary" | "workerName"> & { id?: string }
    ): ActionResult => {
      const worker = state.workers.find((w) => w.id === input.workerId);
      if (!worker) return { ok: false, error: "Please select a valid worker." };

      const calculatedSalary = computeSalaryAmount({
        salaryType: input.salaryType,
        baseRate: input.baseRate,
        eligibleDays: input.eligibleDays,
        completedPieces: input.completedPieces,
        extraWages: input.extraWages,
        deductions: input.deductions,
      });

      let savedId = input.id ?? "";
      setState((prev) => {
        if (input.id) {
          return {
            ...prev,
            salaries: prev.salaries.map((s) =>
              s.id === input.id
                ? {
                    ...s,
                    ...input,
                    id: s.id,
                    workerName: worker.name,
                    calculatedSalary,
                  }
                : s
            ),
          };
        }
        savedId = nextPrefixedId(
          "SAL",
          prev.salaries.map((s) => s.id),
          305
        );
        return {
          ...prev,
          salaries: [
            {
              ...input,
              id: savedId,
              workerName: worker.name,
              calculatedSalary,
            },
            ...prev.salaries,
          ],
        };
      });
      return { ok: true, id: savedId };
    },
    [state.workers]
  );

  const deleteSalaryRecord = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      salaries: prev.salaries.filter((s) => s.id !== id),
    }));
  }, []);

  // Expenses
  const addExpense = useCallback((input: Omit<ExpenseRecord, "id">): ActionResult => {
    if (!input.name.trim()) return { ok: false, error: "Expense name is required." };
    if (input.amount <= 0) return { ok: false, error: "Expense amount must be positive." };

    let createdId = "";
    setState((prev) => {
      createdId = nextPrefixedId(
        "EXP",
        prev.expenses.map((e) => e.id),
        207
      );
      return {
        ...prev,
        expenses: [{ ...input, id: createdId }, ...prev.expenses],
      };
    });
    return { ok: true, id: createdId };
  }, []);

  const updateExpense = useCallback(
    (id: string, input: Partial<Omit<ExpenseRecord, "id">>): ActionResult => {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
      }));
      return { ok: true, id };
    },
    []
  );

  const deleteExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  // Settings & Data controls
  const updateSettings = useCallback((patch: Partial<BusinessSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const clearSampleData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => !o.isSample),
      materials: prev.materials.filter((m) => !m.isSample),
      stockMovements: prev.stockMovements.filter((s) => !s.isSample),
      workers: prev.workers.filter((w) => !w.isSample),
      attendance: prev.attendance.filter((a) => !a.isSample),
      salaries: prev.salaries.filter((s) => !s.isSample),
      expenses: prev.expenses.filter((e) => !e.isSample),
      hasSampleData: false,
    }));
    pushToast({
      type: "info",
      title: "Sample records removed",
      description: "Only your live DP ENTERPRISES records remain.",
    });
  }, [pushToast]);

  const clearAllData = useCallback(() => {
    setState((prev) => ({
      orders: [],
      materials: [],
      stockMovements: [],
      workers: [],
      attendance: [],
      salaries: [],
      expenses: [],
      settings: prev.settings,
      hasSampleData: false,
    }));
    pushToast({
      type: "info",
      title: "Workspace cleared",
      description: "All records have been cleared.",
    });
  }, [pushToast]);

  const resetDemoData = useCallback(() => {
    setState((prev) => {
      const sample = createSampleState();
      return {
        ...sample,
        settings: prev.settings,
      };
    });
    pushToast({
      type: "success",
      title: "Demo data restored",
      description: "Sample DP ENTERPRISES operational records loaded.",
    });
  }, [pushToast]);

  const importBackupJson = useCallback(
    (raw: string): ActionResult => {
      try {
        const parsed = JSON.parse(raw) as Partial<GarmentFlowState>;
        if (!parsed || !Array.isArray(parsed.orders) || !Array.isArray(parsed.materials)) {
          return { ok: false, error: "Invalid GarmentFlow backup JSON structure." };
        }
        setState((prev) => ({
          orders: parsed.orders ?? [],
          materials: parsed.materials ?? [],
          stockMovements: parsed.stockMovements ?? [],
          workers: parsed.workers ?? [],
          attendance: parsed.attendance ?? [],
          salaries: parsed.salaries ?? [],
          expenses: parsed.expenses ?? [],
          settings: { ...prev.settings, ...(parsed.settings ?? {}) },
          hasSampleData: Boolean(parsed.hasSampleData),
        }));
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not parse JSON file." };
      }
    },
    []
  );

  const value = useMemo<GarmentFlowContextValue>(
    () => ({
      state,
      hydrated,
      activeModule,
      setActiveModule,
      editingOrderId,
      setEditingOrderId,
      globalSearch,
      setGlobalSearch,
      toasts,
      pushToast,
      dismissToast,
      addOrder,
      updateOrder,
      deleteOrder,
      archiveOrder,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      recordStockMovement,
      addWorker,
      updateWorker,
      toggleWorkerStatus,
      saveAttendance,
      deleteAttendance,
      saveSalaryRecord,
      deleteSalaryRecord,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearSampleData,
      clearAllData,
      resetDemoData,
      importBackupJson,
    }),
    [
      state,
      hydrated,
      activeModule,
      editingOrderId,
      globalSearch,
      toasts,
      pushToast,
      dismissToast,
      addOrder,
      updateOrder,
      deleteOrder,
      archiveOrder,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      recordStockMovement,
      addWorker,
      updateWorker,
      toggleWorkerStatus,
      saveAttendance,
      deleteAttendance,
      saveSalaryRecord,
      deleteSalaryRecord,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      clearSampleData,
      clearAllData,
      resetDemoData,
      importBackupJson,
    ]
  );

  return (
    <GarmentFlowContext.Provider value={value}>
      {children}
    </GarmentFlowContext.Provider>
  );
}

export function useGarmentFlow() {
  const ctx = useContext(GarmentFlowContext);
  if (!ctx) {
    throw new Error("useGarmentFlow must be used inside GarmentFlowProvider");
  }
  return ctx;
}
