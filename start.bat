@echo off
cd /d "%~dp0"
title Video Player

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js not found in PATH. Install Node.js or run from dev console.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Install failed.
        pause
        exit /b 1
    )
)

echo Starting app...
call npm run dev:electron
echo.
pause
