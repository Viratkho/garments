@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo            GARMENTFLOW - ZERO-COST DATABASE BACKUP UTILITY
echo ===============================================================================
echo.

:: 1. Detect mysqldump binary
set DUMP_BIN=
where mysqldump >nul 2>nul
if %errorlevel% equ 0 (
    set DUMP_BIN=mysqldump
) else if exist "C:\xampp\mysql\bin\mysqldump.exe" (
    set "DUMP_BIN=C:\xampp\mysql\bin\mysqldump.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" (
    set "DUMP_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
)

if "%DUMP_BIN%"=="" (
    echo [ERROR] mysqldump utility was not found.
    echo Please verify MySQL is installed or path is in system environment.
    pause
    exit /b 1
)

:: 2. Create backups folder
if not exist "%~dp0backups" mkdir "%~dp0backups"

:: 3. Generate timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a-%%b)
set mytime=%mytime: =0%
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

set BACKUP_FILE=%~dp0backups\garmentflow_backup_%TIMESTAMP%.sql

echo [INFO] Exporting MySQL database 'garmentflow_db'...
"%DUMP_BIN%" -u root --databases garmentflow_db --result-file="%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Backup created successfully!
    echo Location: %BACKUP_FILE%
    for %%F in ("%BACKUP_FILE%") do echo File Size: %%~zF bytes
) else (
    echo.
    echo [ERROR] Database backup failed. Please ensure MySQL service is running.
)

echo ===============================================================================
pause
