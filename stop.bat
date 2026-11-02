@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo            STOPPING GARMENTFLOW SERVICES
echo ===============================================================================
echo.

:: 1. Terminate process on Port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    set PID=%%a
    if not "!PID!"=="0" (
        echo [INFO] Stopping Backend process (PID: !PID!)...
        taskkill /F /PID !PID! >nul 2>nul
    )
)

:: 2. Terminate process on Port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
    set PID=%%a
    if not "!PID!"=="0" (
        echo [INFO] Stopping Frontend process (PID: !PID!)...
        taskkill /F /PID !PID! >nul 2>nul
    )
)

echo.
echo [OK] GarmentFlow Backend and Frontend services have been stopped.
echo Note: MySQL database daemon remains running for data integrity.
echo ===============================================================================
pause
