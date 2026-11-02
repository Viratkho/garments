@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo            GARMENTFLOW - ZERO-COST MANUFACTURING ERP SYSTEM SETUP
echo ===============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js (v18 or newer) from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js detected: %NODE_VERSION%

:: 2. Detect MySQL / MariaDB
set MYSQL_BIN=
where mysql >nul 2>nul
if %errorlevel% equ 0 (
    set MYSQL_BIN=mysql
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)

if "%MYSQL_BIN%"=="" (
    echo [WARNING] MySQL command-line client was not automatically found in standard paths.
    echo Please ensure MySQL or MariaDB is installed (e.g. via XAMPP or MySQL Community Server).
) else (
    echo [OK] MySQL client found at: %MYSQL_BIN%
)

:: 3. Setup Backend Environment
echo.
echo [1/4] Configuring Backend Environment...
cd /d "%~dp0backend"
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Created backend .env from template.
    ) else (
        echo DATABASE_URL="mysql://root:@localhost:3306/garmentflow_db"> .env
        echo JWT_SECRET="garmentflow_super_secret_local_key_2026">> .env
        echo PORT=5000>> .env
        echo NODE_ENV=development>> .env
        echo [OK] Created fresh backend .env file.
    )
) else (
    echo [OK] Backend .env file already exists.
)

:: 4. Install Backend Dependencies
echo.
echo [2/4] Installing Backend Dependencies (100%% Open-Source / Zero-Cost)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

:: 5. Create Database and Run Prisma Schema Push & Seed
echo.
echo [3/4] Initializing Database Schema (Prisma ORM)...
call npx prisma db push --skip-generate
call npx prisma generate
call node prisma/seed.js
if %errorlevel% neq 0 (
    echo [WARNING] Prisma push/seed encountered a notice. Continuing setup...
)

:: 6. Setup Frontend
echo.
echo [4/4] Setting up Frontend Application...
cd /d "%~dp0frontend"
if not exist ".env" (
    echo VITE_API_BASE_URL=http://localhost:5000/api> .env
    echo [OK] Created frontend .env file.
)

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b 1
)

echo Building production frontend bundle...
call npm run build

echo.
echo ===============================================================================
echo            GARMENTFLOW SETUP COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo  Default Login Credentials:
echo    URL:      http://localhost:5173
echo    Email:    admin@garmentflow.com
echo    Password: admin123
echo.
echo  To start the application, simply run: start.bat
echo ===============================================================================
pause
