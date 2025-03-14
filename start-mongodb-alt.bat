@echo off
setlocal enabledelayedexpansion

echo Starting MongoDB server for LabMateDB...

:: Set MongoDB database path and log path
set "DATA_DIR=%~dp0data\db"
set "LOG_DIR=%~dp0data\log"

:: Create directories if they don't exist
if not exist "%DATA_DIR%" (
    echo Creating MongoDB data directory...
    mkdir "%DATA_DIR%"
)

if not exist "%LOG_DIR%" (
    echo Creating MongoDB log directory...
    mkdir "%LOG_DIR%"
)

echo Data directory: %DATA_DIR%
echo Log directory: %LOG_DIR%
echo.
echo MongoDB will be available at: mongodb://localhost/LabMateDB
echo.
echo Press Ctrl+C to stop the MongoDB server.
echo.

:: Try to start MongoDB with more explicit configuration
mongod --dbpath "%DATA_DIR%" --logpath "%LOG_DIR%\mongodb.log" --logappend

:: This line will only be reached when MongoDB is stopped
echo MongoDB server stopped.

exit /b 0
