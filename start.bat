@echo off
cd /d "%~dp0"
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
echo Starting AI Promptbook v2...
echo.
npm run tauri dev
pause
