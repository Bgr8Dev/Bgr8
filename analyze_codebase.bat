@echo off
echo 🔍 Starting Codebase Analysis...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Run the analysis
python codebase_analyzer.py

echo.
echo ✅ Analysis complete!
echo 📄 Changelog updated in the 'reports' folder
echo    - Changelog: codebase_changelog.md
echo.
pause
