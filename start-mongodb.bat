@echo off
setlocal enabledelayedexpansion

echo Starting MongoDB server for LabMateDB...

:: Set MongoDB database path
set "DATA_DIR=%~dp0data\db"
if not exist "%DATA_DIR%" (
    echo Creating MongoDB data directory...
    mkdir "%DATA_DIR%"
)

echo Data directory: %DATA_DIR%
echo.
echo MongoDB will be available at: mongodb://localhost/LabMateDB
echo.
echo Press Ctrl+C to stop the MongoDB server.
echo.

:: Start MongoDB with basic configuration
mongod --dbpath "%DATA_DIR%"

:: This line will only be reached when MongoDB is stopped
echo MongoDB server stopped.

exit /b 0
