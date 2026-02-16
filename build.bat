@echo off
echo Building AI Promptbook...
call npx tauri build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build complete! Opening output folder...
explorer "%~dp0src-tauri\target\release\bundle\nsis"
