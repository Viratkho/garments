@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo            GARMENTFLOW - ZERO-COST DATABASE RESTORE UTILITY
echo ===============================================================================
echo.

:: 1. Detect mysql binary
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
    echo [ERROR] mysql client utility was not found.
    echo Please verify MySQL is installed or path is in system environment.
    pause
    exit /b 1
)

:: 2. Check backups directory
if not exist "%~dp0backups" (
    echo [ERROR] No backups directory found at %~dp0backups
    pause
    exit /b 1
)

echo Available Backup Files:
echo -------------------------------------------------------------------------------
set COUNT=0
for /f "delims=" %%F in ('dir /b /o-d "%~dp0backups\*.sql" 2^>nul') do (
    set /a COUNT+=1
    set "FILE_!COUNT!=%%F"
    echo   [!COUNT!] %%F
)

if %COUNT% equ 0 (
    echo [ERROR] No .sql backup files found in %~dp0backups
    pause
    exit /b 1
)

echo -------------------------------------------------------------------------------
echo.
set /p CHOICE="Enter backup number to restore [Default: 1 (Latest)]: "
if "%CHOICE%"=="" set CHOICE=1

set SELECTED_FILE=!FILE_%CHOICE%!
if "%SELECTED_FILE%"=="" (
    echo [ERROR] Invalid selection number.
    pause
    exit /b 1
)

set FULL_PATH=%~dp0backups\%SELECTED_FILE%
echo.
echo [WARNING] Restoring will overwrite existing data in 'garmentflow_db'!
echo Selected File: %SELECTED_FILE%
echo.
set /p CONFIRM="Type 'YES' to proceed with restore: "
if /i not "%CONFIRM%"=="YES" (
    echo [INFO] Restore operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo [INFO] Restoring database from %SELECTED_FILE%...
"%MYSQL_BIN%" -u root garmentflow_db < "%FULL_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Database restored successfully from %SELECTED_FILE%!
) else (
    echo.
    echo [ERROR] Database restore failed. Please ensure MySQL is running.
)

echo ===============================================================================
pause
