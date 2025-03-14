@echo off
setlocal enabledelayedexpansion

echo Checking for Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking for Nodemon installation...
call npm list -g nodemon >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Nodemon is not installed globally. Installing now...
    call npm install -g nodemon
    if %ERRORLEVEL% neq 0 (
        echo Failed to install Nodemon. Please check your internet connection or npm configuration.
        pause
        exit /b 1
    )
    echo Nodemon installed successfully.
) else (
    echo Nodemon is already installed.
)

echo Starting local server with Nodemon on port 3000...

rem Start nodemon in the background
start cmd /c "nodemon index.js"

rem Wait a moment for the server to start
timeout /t 3 /nobreak >nul

rem Open the default browser to localhost:3000
start http://localhost:3000

echo Server running at http://localhost:3000
echo Press Ctrl+C in the server window to stop the server.

exit /b 0
