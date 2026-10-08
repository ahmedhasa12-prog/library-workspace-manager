@echo off
echo Library Workspace Manager - Pre-Build Verification
echo =======================================================
echo.
echo Checking for required files...
echo.

set "missing=0"
set "empty=0"

rem Check key files
for %%f in (package.json build-windows.bat src/main/db.ts src/main/ipc.ts src/main/main.ts src/main/preload.ts src/renderer/App.tsx src/renderer/index.css src/renderer/index.html src/shared/types.ts) do (
    if not exist %%f (
        echo [MISSING] %%f
        set /a missing+=1
    ) else (
        for /f %%a in ('type %%f ^| find /v /c "" ^| findstr /r "[1-9][0-9]*"') do (
            if %%a equ 0 (
                echo [EMPTY] %%f
                set /a empty+=1
            )
        )
    )
)

if %missing% gtr 0 (
    echo.
    echo ERROR: %missing% file(s) are missing!
    echo Please ensure all source files are present before building.
    goto :eof
)

if %empty% gtr 0 (
    echo.
    echo WARNING: %empty% file(s) appear to be empty!
    echo Please check these files before proceeding.
    echo.
)

echo.
echo All required files are present and contain content.
echo You can now safely run the build process.
echo.
pause