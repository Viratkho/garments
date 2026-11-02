# GARMENTFLOW – Garment Manufacturing & Business Management System

A production-ready, full-stack business management application specifically architected for small garment manufacturing shops. Replaces handwritten paper ledgers, fragmented diaries, and guesswork with a centralized digital system.

---

## Key Business Capabilities

1. **Company & Client Management**: Register corporate uniform buyers, fashion brands, and private label retailers with GSTIN, contact ledgers, and order history.
2. **Bulk Order Management**: Manage variable quantities, per-piece pricing vs. fixed quotations, tech pack attachments, design specifications, and delivery target dates.
3. **Dynamic Material Management & Weighted Average Costing**:
   - Register unlimited custom fabrics (Cotton, Polyester, Denim), threads, buttons, zippers, linings, packaging materials.
   - Automatically computes: `Unit Cost = Total Purchase Price / Purchase Quantity`.
   - Dynamic Weighted Average Costing: `Weighted Average Cost = Total Purchase Value / Total Available Purchase Quantity`. Previous purchase prices are never overwritten.
   - Separate handling of shop-purchased inventory vs. company-supplied fabrics (which do not inflate shop expenses).
4. **Order-Wise Material Consumption**:
   - Historical unit cost snapshots stored per order.
   - Wastage and cutting scrap tracking.
   - Reversing consumption restores physical stock into inventory.
5. **Worker Management & Labour Allocation**:
   - Register tailors, masters, stitchers with monthly salary, daily wage, or per-piece pay.
   - Productive monthly hours configuration (default: 200 hours).
   - Dynamic hourly rate derivation: `Hourly Rate = Monthly Salary / Productive Hours`.
   - **Critical Accounting Rule**: Actual salaries are recorded once as general business expenses. Labour costs allocated inside order sheets distribute this wage expense across manufacturing jobs without double-counting.
6. **10-Stage Production Pipeline**:
   - Order Received → Materials Arranged → Cutting / Preparation → Collar Stitching → Pocket Stitching → Main Stitching → Finishing → Quality Checking → Completed → Delivered.
   - Defective and rework tracking at every stage.
   - Quality inspection pass/fail logging and partial/full delivery dispatch.
7. **Centralized Order Costing Engine**:
   - Single source of financial truth calculated in the backend.
   - Cost components: Actual Material Cost + Allocated Labour Cost + Direct Expenses + Allocated Overheads.
   - Calculates Net Order Profit, Profit Margin %, Cost Per Garment, and pending client receivables.
8. **Invoicing & Tax Management**:
   - Professional printable PDF tax invoice generation.
   - GST is fully configurable and optional (supports unregistered shops).
   - Live tracking of advance deposits, instalments, and final settlements.
9. **Executive Real-Time Dashboard**:
   - 9 live KPI cards calculated from MySQL records.
   - Monthly Revenue vs. Expenses charts (Recharts).
   - Order Status Distribution and Company Revenue breakdowns.
   - Low raw material inventory alert triggers.
10. **Reports & Data Export**:
    - Order Costing & Profitability report exported to formatted Excel (`.xlsx`).
    - Raw Materials Inventory & Valuation report exported to Excel (`.xlsx`).
    - Annual Profit & Loss (P&L) statements.

---

## Technology Architecture

### Frontend
- **React.js 18** with **Vite**
- **Tailwind CSS** (configured with `#172B4D` Navy, `#2563EB` Blue, `#F5F7FA` Surface)
- **React Router v6**
- **Recharts** (data visualization)
- **Lucide React** (icons)

### Backend
- **Node.js** & **Express.js** REST API
- **Prisma ORM** with **MySQL / MariaDB**
- **JWT & bcryptjs** authentication and password hashing
- **ExcelJS** for Excel reports
- **PDFKit** for PDF tax invoice generation
- **Multer** for controlled design tech-pack and receipt file uploads
- **Centralized Error Handling** with custom error formatting

### Database
- **MySQL / MariaDB** with 30 relational tables, foreign key constraints, indexed queries, and decimal arithmetic for monetary precision (`DECIMAL(12, 2)`).

---

## Installation & Setup

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **MySQL Server** or **MariaDB** running on port `3306`
- **npm** or **pnpm**

### 2. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE garmentflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp ../.env.example .env

# Push schema to MySQL database
npx prisma db push

# Seed initial admin, 10 production stages, categories, and settings
npm run prisma:seed

# Run the Mandatory Acceptance Test (ABC Textiles scenario)
npm run test:acceptance

# Start backend server
npm start
# (or npm run dev for hot-reload)
```

Default Admin Credentials:
- **Email**: `admin@garmentflow.com`
- **Password**: `admin123`

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# (For production build)
npm run build
```

The frontend application runs on `http://localhost:5173`.

---

## Mandatory Acceptance Test Verification

The application includes an automated test verifying the entire ABC Textiles business scenario:
```bash
cd backend
npm run test:acceptance
```

### Verified Scenario:
1. Created company **ABC Textiles**.
2. Created bulk order for **500 customized shirts** @ ₹70/shirt → **₹35,000 revenue**.
3. Sourced **100m cotton fabric** for ₹8,000 (Unit cost: ₹80/m).
4. Sourced **20 rolls thread** for ₹1,000 (Unit cost: ₹50/roll).
5. Recorded consumption of **80m cotton** (₹6,400) + **10 rolls thread** (₹500) = **₹6,900 material cost**.
6. Registered 3 workers with salaries **₹12,000**, **₹11,000**, **₹10,000** (Hourly rates: ₹60, ₹55, ₹50).
7. Allocated **20 hrs**, **15 hrs**, **10 hrs** = **₹2,525 allocated labour cost**.
8. Recorded **₹500 direct order expenses** (packaging/buttons).
9. Progressed 500 pcs through 10 stages, passed QC, and dispatched delivery.
10. Generated invoice for **₹35,000**.
11. Recorded **₹10,000 advance payment** → balance verified at **₹25,000**.
12. Centralized Order Costing Engine Verification:
    - **Total Revenue**: ₹35,000
    - **Actual Material Cost**: ₹6,900
    - **Allocated Labour Cost**: ₹2,525
    - **Direct Order Expenses**: ₹500
    - **Total Order Cost**: ₹9,925
    - **Net Order Profit**: ₹25,075
    - **Profit Margin**: 71.64%
    - **Cost Per Garment**: ₹19.85/shirt
    - **Remaining Cotton Stock**: 18m (accounting for 2m cutting wastage)
    - **Remaining Thread Stock**: 10 rolls

---

## Windows Quick Start (Zero-Cost One-Click Scripts)

The system includes pre-configured Windows batch scripts in the project root for seamless local operation without requiring command-line expertise:

1. **`setup.bat`**:
   - Automatically detects Node.js and MySQL / MariaDB (including XAMPP).
   - Generates local `.env` configuration files.
   - Installs backend and frontend dependencies (100% free open-source).
   - Synchronizes MySQL database schema via Prisma ORM and seeds initial data.
   - Compiles the production frontend bundle.

2. **`start.bat`**:
   - Checks if MySQL daemon is running on port 3306 (starts XAMPP MariaDB if stopped).
   - Launches the Backend API on port 5000.
   - Launches the Frontend Web UI on port 5173.
   - Automatically opens your default web browser to `http://localhost:5173`.

3. **`stop.bat`**:
   - Safely terminates Node.js backend and frontend processes listening on ports 5000 and 5173.
   - Preserves MySQL database daemon running for uninterrupted data integrity.

4. **`backup.bat`**:
   - Uses `mysqldump` to create a point-in-time snapshot of the database.
   - Automatically saves timestamped SQL dumps into the `backups/` directory (e.g. `garmentflow_backup_YYYY-MM-DD_HH-MM-SS.sql`).

5. **`restore.bat`**:
   - Lists available backup files in `backups/`.
   - Prompts for confirmation and restores `garmentflow_db` from the chosen backup snapshot.

---

## Local Network & Mobile / Tablet Access (Zero Cloud Cost)

GarmentFlow can be accessed across all shop devices (owner desktop, tablet, and tailor smartphones) on the local shop Wi-Fi network with **zero hosting fees**:

1. Find the host computer's Local IPv4 Address by running `ipconfig` in Command Prompt (e.g., `192.168.1.50`).
2. Update `frontend/vite.config.js` or start Vite with host binding:
   ```bash
   npm run dev -- --host
   ```
3. Allow incoming connections to ports 5000 and 5173 through Windows Defender Firewall.
4. From any Android smartphone, iPhone, or tablet connected to the same shop Wi-Fi network, open Chrome or Safari and navigate to:
   ```
   http://192.168.1.50:5173
   ```
All mobile devices share the exact same live MySQL database and real-time backend with full responsive layout.

---

## Comprehensive Automated Audit & Test Suite

Run the full 52-point automated verification suite covering Section 6 (Dynamic Inventory), Section 8 (Payroll & Double-Counting), Section 9 (Financials), and all 17 REST API modules:

```bash
cd backend
node tests/comprehensiveAuditTest.js
```

All 52 assertions execute and verify with 100% pass rate:
- **Section 6**: Pure Cotton purchase 100m @ Rs 80 -> purchase 100m @ Rs 90 -> weighted avg unit cost Rs 85.00. Consumption of 80m recorded at Rs 85 = Rs 6,800. Remaining stock 120m, valuation Rs 10,200.
- **Section 8**: 3 workers with salaries Rs 12,000, Rs 11,000, Rs 10,000 (Rs 33,000 monthly commitment). Wage disbursement of Rs 18,000 creates business expenses once. Suresh partial balance Rs 5,000 verified. Allocated labour of Rs 7,000 leaves Rs 26,000 unallocated labour overhead without double-counting in net operating profit.
- **Section 9**: Revenue Rs 35,000, Material Cost Rs 10,000, Labour Cost Rs 7,000, Direct Expenses Rs 3,000 -> Total Order Cost Rs 20,000, Net Profit Rs 15,000, Profit Margin 42.86%. Client payments Rs 30,000 -> Pending balance Rs 5,000.
- **REST APIs**: All 17 modules tested with active JWT authentication, database persistence, PDFKit invoice generation (2,827 bytes), and ExcelJS report workbook generation (7,477 bytes).

---

## Zero-Cost License Compliance

| Dependency / Component | License | Cost / Fee | Model |
| :--- | :--- | :--- | :--- |
| **Node.js & Express.js** | MIT | ₹0.00 | Free & Open Source |
| **React.js & Vite** | MIT | ₹0.00 | Free & Open Source |
| **Tailwind CSS** | MIT | ₹0.00 | Free & Open Source |
| **MySQL Community / MariaDB** | GPL v2 / LGPL | ₹0.00 | Free Self-Hosted |
| **Prisma ORM** | Apache-2.0 | ₹0.00 | Free & Open Source |
| **PDFKit** | MIT | ₹0.00 | Free Native Engine |
| **ExcelJS** | MIT | ₹0.00 | Free Native Engine |
| **Recharts** | MIT | ₹0.00 | Free & Open Source |
| **Lucide React** | ISC | ₹0.00 | Free & Open Source |
| **bcryptjs & jsonwebtoken** | MIT | ₹0.00 | Free & Open Source |
| **Multer (Local File System)** | MIT | ₹0.00 | Free Local Storage |

**Total Operating Cost**: **₹0.00 / month forever**. No subscriptions, no cloud credits, no paid API keys.

---

## Directory Structure

```
garmentflow/
  backend/
    prisma/
      schema.prisma           # Complete MySQL Prisma schema
      seed.js                 # Database seeder (Admin, stages, categories)
    src/
      config/
        database.js           # Prisma client instance
      controllers/            # Express controllers for all 17 modules
      middleware/
        authMiddleware.js     # JWT protection & role check
        errorHandler.js       # Centralized error handler
        uploadMiddleware.js   # Multer file upload storage
      routes/                 # REST API route handlers
      services/
        costingEngine.js      # Centralized financial calculation engine
        inventoryService.js   # Weighted average costing & stock service
        pdfService.js         # PDFKit invoice generation
        excelService.js       # ExcelJS report generation
      app.js                  # Express application setup
      server.js               # Node server entrypoint
    tests/
      acceptanceTest.js       # Acceptance test scenario runner
    package.json
    .env
  frontend/
    src/
      components/
        common/               # StatCard, Modal, Button, FormControls, Badge, EmptyState
        layout/               # Sidebar, Header, MainLayout
      context/                # AuthContext, NotificationContext
      hooks/                  # useAuth, useNotification
      pages/                  # All 17 module views
      services/
        api.js                # API client with token handling
      utils/
        formatters.js         # Indian Rupee currency & date formatting
      App.jsx                 # Routing configuration
      main.jsx                # Application root
      index.css               # Tailwind CSS & custom styling
    package.json
    vite.config.js            # Vite configuration with API proxy
    tailwind.config.js        # Brand color palette
  .env.example
  README.md
```

---

## License & Support
GarmentFlow is built as a complete, reliable, and production-ready business management ERP for garment manufacturers.
