@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo            STARTING GARMENTFLOW MANUFACTURING ERP APPLICATION
echo ===============================================================================
echo.

:: 1. Check if MySQL is running on port 3306
netstat -ano | findstr ":3306 " >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MySQL Service detected running on port 3306.
) else (
    echo [INFO] MySQL is not active on port 3306. Attempting local startup...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [INFO] Starting XAMPP MariaDB daemon...
        start "GarmentFlow MySQL" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 /nobreak >nul
    ) else (
        echo [WARNING] Could not automatically launch MySQL service.
        echo Please make sure MySQL or XAMPP MySQL is running before proceeding.
    )
)

:: 2. Launch Backend Server in dedicated window
echo [INFO] Starting Backend API Server (Port 5000)...
start "GarmentFlow Backend API" cmd /c "cd /d ""%~dp0backend"" && npm start"

:: 3. Launch Frontend Vite Server in dedicated window
echo [INFO] Starting Frontend Web Interface (Port 5173)...
start "GarmentFlow Web App" cmd /c "cd /d ""%~dp0frontend"" && npm run dev"

:: 4. Brief delay to allow service boot
echo [INFO] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

:: 5. Open Default Browser
echo [INFO] Launching browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===============================================================================
echo            GARMENTFLOW ERP IS RUNNING!
echo ===============================================================================
echo  Access Web App:       http://localhost:5173
echo  Backend Health Check: http://localhost:5000/api/health
echo.
echo  Default Credentials:
echo    Email:    admin@garmentflow.com
echo    Password: admin123
echo.
echo  To gracefully stop all services, run: stop.bat
echo ===============================================================================
echo.
pause
