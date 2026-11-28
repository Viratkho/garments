export type ModuleId =
  | "dashboard"
  | "new-order"
  | "all-orders"
  | "inventory"
  | "stock"
  | "workers"
  | "attendance"
  | "salary"
  | "expenses"
  | "earnings"
  | "profit-loss"
  | "settings";

export type ThemeMode = "dark" | "light";

export type BackgroundStyleId =
  | "midnight-solid"
  | "carbon-solid"
  | "pearl-solid"
  | "subtle-violet"
  | "dark-radial"
  | "soft-mesh"
  | "minimal-glass";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type PricingMethod = "per-piece" | "fixed";

export type OrderStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface Order {
  id: string;
  companyName: string;
  contactNumber: string;
  garmentType: string;
  description: string;
  quantity: number;
  pricingMethod: PricingMethod;
  perPieceRate: number;
  fixedOrderValue: number;
  orderValue: number;
  materialCost: number;
  labourCost: number;
  otherCosts: number;
  orderCost: number;
  expectedProfit: number;
  orderDate: string; // YYYY-MM-DD
  expectedCompletionDate: string; // YYYY-MM-DD
  status: OrderStatus;
  notes: string;
  archived?: boolean;
  isSample?: boolean;
}

export type MaterialCategory =
  | "Cotton Fabric"
  | "Polyester Fabric"
  | "Collar Fabric"
  | "Pocket Fabric"
  | "Thread"
  | "Buttons"
  | "Zippers"
  | "Labels"
  | "Packaging Materials"
  | "Others";

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  description: string;
  unit: string;
  availableQuantity: number;
  minimumStockLevel: number;
  unitCost: number;
  isSample?: boolean;
}

export type StockMovementType =
  | "Stock In"
  | "Stock Out"
  | "Order Consumption"
  | "Wastage"
  | "Stock Adjustment";

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  movementType: StockMovementType;
  /** Signed delta applied to inventory (+ for inward/positive adjustment, - for outward/consumption/wastage/negative adjustment) */
  delta: number;
  /** Absolute quantity entered by user */
  quantity: number;
  date: string; // YYYY-MM-DD
  reason: string;
  relatedOrderId?: string;
  notes: string;
  isSample?: boolean;
}

export type WorkerPaymentType =
  | "Monthly Salary"
  | "Daily Wage"
  | "Per-Piece Wage";

export type WorkerStatus = "Active" | "Inactive";

export interface Worker {
  id: string;
  name: string;
  phone: string;
  address: string;
  joiningDate: string; // YYYY-MM-DD
  paymentType: WorkerPaymentType;
  salaryRate: number;
  status: WorkerStatus;
  role: string;
  notes: string;
  isSample?: boolean;
}

export type AttendanceStatus = "Present" | "Absent" | "Half-Day" | "Leave";

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  workingHours: number;
  notes: string;
  isSample?: boolean;
}

export type SalaryRecordStatus = "Calculated" | "Approved" | "Recorded";

export interface SalaryRecord {
  id: string;
  workerId: string;
  workerName: string;
  salaryType: WorkerPaymentType;
  month: number; // 1-12
  year: number;
  baseRate: number;
  eligibleDays: number;
  completedPieces: number;
  extraWages: number;
  deductions: number;
  calculatedSalary: number;
  status: SalaryRecordStatus;
  notes: string;
  isSample?: boolean;
}

export type ExpenseCategory =
  | "Electricity"
  | "Transportation"
  | "Packaging"
  | "Machine Maintenance"
  | "Rent"
  | "Other Expenses";

export interface ExpenseRecord {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  notes: string;
  isSample?: boolean;
}

export interface BusinessSettings {
  businessName: string;
  applicationName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  currency: CurrencyCode;
  theme: ThemeMode;
  backgroundStyle: BackgroundStyleId;
  compactTables: boolean;
  animateNumbers: boolean;
  showSampleBanner: boolean;
}

export interface GarmentFlowState {
  orders: Order[];
  materials: MaterialItem[];
  stockMovements: StockMovement[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  salaries: SalaryRecord[];
  expenses: ExpenseRecord[];
  settings: BusinessSettings;
  hasSampleData: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}
