"use client";

import React from "react";
import { AppShell } from "@/components/AppShell";
import { AllOrdersModule } from "@/components/modules/AllOrdersModule";
import { AttendanceModule } from "@/components/modules/AttendanceModule";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { ExpensesModule } from "@/components/modules/ExpensesModule";
import { InventoryModule } from "@/components/modules/InventoryModule";
import { MonthlyEarningsModule } from "@/components/modules/MonthlyEarningsModule";
import { ProfitLossModule } from "@/components/modules/ProfitLossModule";
import { SalaryModule } from "@/components/modules/SalaryModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { StockModule } from "@/components/modules/StockModule";
import { TakeNewOrderModule } from "@/components/modules/TakeNewOrderModule";
import { WorkersModule } from "@/components/modules/WorkersModule";
import { useGarmentFlow } from "@/context/GarmentFlowContext";

export default function HomePage() {
  const { activeModule } = useGarmentFlow();

  return (
    <AppShell>
      {activeModule === "dashboard" && <DashboardModule />}
      {activeModule === "new-order" && <TakeNewOrderModule />}
      {activeModule === "all-orders" && <AllOrdersModule />}
      {activeModule === "inventory" && <InventoryModule />}
      {activeModule === "stock" && <StockModule />}
      {activeModule === "workers" && <WorkersModule />}
      {activeModule === "attendance" && <AttendanceModule />}
      {activeModule === "salary" && <SalaryModule />}
      {activeModule === "expenses" && <ExpensesModule />}
      {activeModule === "earnings" && <MonthlyEarningsModule />}
      {activeModule === "profit-loss" && <ProfitLossModule />}
      {activeModule === "settings" && <SettingsModule />}
    </AppShell>
  );
}
