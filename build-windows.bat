@echo off
echo Library Workspace Manager - Automatic Windows Builder
echo =======================================================
echo.
echo This script will:
echo 1. Install all required dependencies
echo 2. Set up the database
echo 3. Build a Windows installer (.exe file) compatible with Windows 10 and 11
echo.
echo Please wait... this may take 5-10 minutes.
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ERROR: Please run this batch file from the LibraryManager folder
    pause
    exit /b 1
)

REM Install dependencies
echo Step 1/3: Installing dependencies...
npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies. Make sure you have Node.js installed.
    echo.
    pause
    exit /b 1
)

REM Initialize database
echo.
echo Step 2/3: Initializing database...
npx tsx src/main/database/init.ts
if errorlevel 1 (
    echo.
    echo ERROR: Database initialization failed
    pause
    exit /b 1
)

REM Build Windows installer
echo.
echo Step 3/3: Building Windows installer for Windows 10/11...
npm run dist:win
if errorlevel 1 (
    echo.
    echo ERROR: Build failed. See messages above for details.
    echo.
    echo Troubleshooting tips:
    echo   1. Ensure you have Node.js installed from nodejs.org
    echo   2. Run this script as Administrator if you see permission errors
    echo   3. Temporarily disable antivirus if it blocks the build
    pause
    exit /b 1
)

echo.
echo =======================================================
echo BUILD COMPLETED SUCCESSFULLY!
echo.
echo Your Windows 10/11 compatible installer is ready:
echo   %cd%\dist-electron\Library Workspace Manager Setup x64.exe
echo.
echo To install on any Windows computer:
echo   1. Copy that .exe file to the target computer
echo   2. Double-click it to install (may require Administrator rights)
echo   3. Launch "Library Workspace Manager" from the Start menu
echo.
echo The installer is compatible with:
echo   - Windows 10 version 1809 and later
echo   - Windows 11 version 21H2 and later
echo   - Windows Server 2019/2022 in Desktop Experience mode
echo.
pause