@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 LTS from https://nodejs.org and try again.
  pause
  exit /b 1
)
if not exist node_modules\electron\package.json (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run start:desktop
if errorlevel 1 pause
