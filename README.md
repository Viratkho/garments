# DP ENTERPRISES – GarmentFlow

> **Garment Manufacturing, Bulk Order, Stitching and Business Management System**

A production-ready, full-stack ERP and manufacturing business management application architected specifically for **DP ENTERPRISES**. Replaces handwritten paper ledgers, fragmented diaries, and guesswork with a centralized, professional digital operating system.

---

## 🏢 Business Identity & Branding

- **Business Name**: **DP ENTERPRISES**
- **Application Name**: **DP ENTERPRISES – GarmentFlow**
- **Business Description**: Garment Manufacturing, Bulk Order, Stitching and Business Management System
- **Typographic Monogram**: `[DP]` deep navy / primary blue corporate emblem fallback until custom logo is uploaded
- **Company Logo Support**: High-resolution image upload (`PNG`, `JPG`, `WEBP`) with instant preview and dynamic placement across all invoices, reports, and UI headers
- **Configurable Settings**: Business Address, Phone, Email, GSTIN, and Bank Settlement details configurable directly in Settings without code changes or fake placeholders

---

## 🚀 Key Business Capabilities

1. **Company & Client Management**: Register corporate uniform clients, fashion brands, and retail partners with GSTIN, contact ledgers, order histories, and receivables tracking.
2. **Bulk Order Management**: Manage order specs, garment styles, quantities, custom rates per piece, tech packs, cutting ratios, and target delivery dates.
3. **Dynamic Material Management & Weighted Average Costing**:
   - Register unlimited custom fabrics (Cotton, Polyester, Denim), threads, buttons, zippers, linings, and packaging trims.
   - Automatically computes: `Unit Cost = Total Purchase Price / Purchase Quantity`.
   - Dynamic Weighted Average Costing: `Weighted Average Cost = Total Purchase Value / Total Available Purchase Quantity`. Previous purchase rates are preserved historically.
   - Distinct classification between shop-purchased inventory and company-supplied fabrics (which do not inflate shop purchase expenses).
4. **Order-Wise Material Consumption**:
   - Historical unit cost snapshots locked per order.
   - Wastage and cutting scrap tracking.
   - Reversing consumption restores physical stock into inventory.
5. **Worker Management & Labour Allocation**:
   - Register tailors, masters, and finishers with monthly salary, daily wage, or per-piece pay.
   - Dynamic hourly rate derivation: `Hourly Rate = Monthly Salary / Productive Hours (200 hrs)`.
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
   - Professional printable PDF tax invoice generation featuring **DP ENTERPRISES** branding and uploaded logo.
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
    - Annual Profit & Loss (P&L) statements with dedicated one-click PDF export.

---

## 🛠️ Technology Architecture

### Frontend
- **React.js 18** with **Vite**
- **Tailwind CSS** (configured with `#172B4D` Navy, `#2563EB` Blue, `#F5F7FA` Surface)
- **React Router v6**
- **Recharts** (data visualization)
- **Lucide React** (icons)
- **CompanyContext** for live reactive company branding and logo state

### Backend
- **Node.js** & **Express.js** REST API (listening on `0.0.0.0:5000`)
- **Prisma ORM** with **MySQL / MariaDB**
- **JWT & bcryptjs** authentication and password hashing
- **ExcelJS** for Excel reports with DP ENTERPRISES header blocks
- **PDFKit** for PDF tax invoice and Profit & Loss report generation
- **Multer** for controlled tech-pack and company logo uploads
- **Centralized Error Handling** with custom error formatting

### Database
- **MySQL / MariaDB** with 30 relational tables, foreign key constraints, indexed queries, and decimal arithmetic for monetary precision (`DECIMAL(12, 2)`).

---

## 📁 Repository Structure

```
GARMENTFLOW/
├── frontend/                     # React.js Vite frontend client
│   ├── src/
│   │   ├── components/           # Common components, Layouts, CompanyLogo
│   │   ├── context/              # AuthContext, CompanyContext, NotificationContext
│   │   ├── pages/                # All 17 business ERP modules
│   │   ├── services/             # Axios API client
│   │   └── utils/                # Currency & date formatters
│   ├── index.html                # App title: DP ENTERPRISES – GarmentFlow
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                      # Node.js Express REST API
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma schema definition
│   │   └── seed.js               # Initial seeder with DP ENTERPRISES settings
│   ├── src/
│   │   ├── config/               # Database client
│   │   ├── controllers/          # Controllers for all 17 modules
│   │   ├── middleware/           # Auth, Multer, Error handlers
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # CostingEngine, Inventory, PDF, Excel services
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── acceptanceTest.js     # ABC Textiles scenario acceptance test
│   │   └── comprehensiveAuditTest.js # 52-point audit verification suite
│   ├── uploads/                  # Upload directory for logos and tech packs
│   └── package.json
├── database/                     # Database schema dumps & Prisma definitions
│   ├── schema.sql                # Complete MySQL/MariaDB database dump
│   ├── schema.prisma             # Entity schema definition
│   └── README.md
├── scripts/                      # Management & automation scripts
│   ├── setup.bat                 # Automated dependency and database setup
│   ├── start.bat                 # One-click startup for MySQL, Backend, Frontend
│   ├── stop.bat                  # One-click shutdown
│   ├── backup.bat                # Automated mysqldump backup
│   ├── restore.bat               # Interactive database restore
│   ├── verify-system.js          # Cross-platform health check script
│   └── README.md
├── backups/                      # Timestamped SQL database backup files
├── package.json                  # Root workspace convenience scripts
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules
└── README.md                     # Complete project documentation
```

---

## ⚡ Quick Start & Installation

### Option A: Windows One-Click Setup (Recommended)

1. Double-click **`setup.bat`** (or `scripts/setup.bat`) to verify Node.js and MySQL, install dependencies, and run database migrations.
2. Double-click **`start.bat`** (or `scripts/start.bat`) to launch the MySQL service, backend server, and frontend client. Your default browser will open automatically to `http://localhost:5173`.
3. To shut down all services, double-click **`stop.bat`**.

### Option B: Manual Setup

#### 1. Database Setup
Ensure MySQL / MariaDB is running on port `3306`, then create the database:
```sql
CREATE DATABASE garmentflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma db push
npm run prisma:seed
npm start
```

Default Admin Credentials:
- **Email**: `admin@garmentflow.com`
- **Password**: `admin123`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

### 1. Comprehensive System Audit Suite (52/52 Assertions)
```bash
cd backend
node tests/comprehensiveAuditTest.js
```
Verifies Section 6 (Dynamic Inventory), Section 8 (Payroll & Double-Counting), Section 9 (Financials), and all 17 REST API modules.

### 2. Mandatory Acceptance Test (ABC Textiles Scenario)
```bash
cd backend
node tests/acceptanceTest.js
```
Executes the complete end-to-end manufacturing flow:
- Created company **ABC Textiles**.
- Bulk order for **500 customized shirts** @ ₹70/shirt → **₹35,000 revenue**.
- Sourced **100m cotton fabric** (₹8,000) & **20 rolls thread** (₹1,000).
- Consumed **80m cotton** (₹6,400) + **10 rolls thread** (₹500) = **₹6,900 material cost**.
- Allocated 3 workers (20 hrs, 15 hrs, 10 hrs) = **₹2,525 labour cost**.
- Recorded **₹500 direct order expenses**.
- 10-stage production completed, passed QC, and dispatched delivery.
- Generated invoice for **₹35,000**, recorded **₹10,000 advance payment** (₹25,000 balance).
- Verified Net Order Profit **₹25,075** (71.64% profit margin).

### 3. System Verification Script
```bash
npm run verify
```

---

## 📱 Mobile & Tablet Local Network Access

GarmentFlow is fully responsive and can be accessed from mobile phones and tablets on the shop's local Wi-Fi network without any hosting costs:

1. Run `ipconfig` on the host PC to find its IPv4 address (e.g., `192.168.1.50`).
2. Both backend and frontend servers are pre-configured to bind to `0.0.0.0`.
3. On any mobile device or tablet connected to the same Wi-Fi, open the browser to:
   ```
   http://192.168.1.50:5173
   ```

---

## 🔒 Absolute Zero-Cost Compliance

| Component | Technology | License | Operating Cost |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Node.js / Express.js | MIT | ₹0.00 |
| **Frontend Framework** | React.js / Vite / Tailwind CSS | MIT | ₹0.00 |
| **Database** | MySQL Community / MariaDB | GPL v2 / LGPL | ₹0.00 |
| **Database ORM** | Prisma ORM | Apache-2.0 | ₹0.00 |
| **Document Generation** | PDFKit & ExcelJS | MIT | ₹0.00 |
| **Data Visualization** | Recharts | MIT | ₹0.00 |
| **Iconography** | Lucide React | ISC | ₹0.00 |
| **Authentication & Storage** | JWT / bcryptjs / Local Multer | MIT | ₹0.00 |

**Total Operating Cost**: **₹0.00 / month forever**. Zero recurring fees, zero cloud charges, zero credit-based APIs.
