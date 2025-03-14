@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Starting LabMate Application Suite
echo ===================================

:: Check if port 3000 is already in use
echo Checking if port 3000 is already in use...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% EQU 0 (
    echo Port 3000 is already in use. Attempting to free it...
    
    :: Find the PID using port 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        set PID=%%a
        goto :found_pid
    )
    
    :found_pid
    echo Attempting to terminate process with PID !PID!...
    taskkill /F /PID !PID!
    
    :: Wait a moment for the port to be released
    timeout /t 2 /nobreak > nul
    
    :: Check again if port is free
    netstat -ano | findstr :3000 > nul
    if %ERRORLEVEL% EQU 0 (
        echo Failed to free port 3000. Please close the application using this port manually.
        echo You can identify the process using: netstat -ano ^| findstr :3000
        echo Then terminate it using: taskkill /F /PID [PID]
        pause
        exit /b 1
    ) else (
        echo Successfully freed port 3000.
    )
) else (
    echo Port 3000 is available.
)

:: Check for Node.js installation
echo Checking for Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install project dependencies if needed
echo Checking project dependencies...
if not exist "node_modules" (
    echo Node modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Failed to install dependencies. Please check your internet connection or npm configuration.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
) else (
    echo Node modules found.
)

:: Start MongoDB Community Server
echo.
echo NOTE: Make sure MongoDB Community Server is installed and running.
echo If MongoDB is not running, please start it manually before continuing.
echo.
echo Press any key to continue with starting the application...
pause >nul

:: Start the Node.js application with Nodemon
echo Starting Node.js application with Nodemon on port 3000...
start "Node.js Server" cmd /c npx nodemon index.js

:: Wait for the server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

:: Open the default browser to localhost:3000
echo Opening application in browser...
start http://localhost:3000

echo ===================================
echo LabMate Application Suite is running
echo ===================================
echo Web Server: Running at http://localhost:3000
echo.
echo To stop the application:
echo 1. Close the Node.js window
echo 2. Or press Ctrl+C in the Node.js window
echo ===================================

exit /b 0
