# DP ENTERPRISES – GarmentFlow Automation & Management Scripts

This directory contains utility scripts to manage, launch, back up, and verify **DP ENTERPRISES – GarmentFlow**.

## Available Scripts

1. **`setup.bat`**:
   - Detects Node.js, npm, and MySQL.
   - Installs all dependencies for both `backend` and `frontend`.
   - Generates Prisma client bindings and applies database schema/seeds.
   - Creates the initial storage and backup folders.

2. **`start.bat`**:
   - Launches MySQL service (if installed via XAMPP or Windows Service).
   - Starts the Express backend on `http://localhost:5000`.
   - Starts the Vite frontend on `http://localhost:5173`.
   - Opens the browser directly to the DP ENTERPRISES login screen.

3. **`stop.bat`**:
   - Cleanly shuts down active Node.js processes for GarmentFlow backend and frontend servers.

4. **`backup.bat`**:
   - Performs a complete timestamped dump of `garmentflow_db` into the `backups/` folder using `mysqldump`.

5. **`restore.bat`**:
   - Interactively restores the database from any SQL file in `backups/` or `database/schema.sql`.

6. **`verify-system.js`**:
   - Node-based cross-platform verification script testing backend API health and database connectivity.
   - Run via: `node scripts/verify-system.js` or `npm run verify`.
