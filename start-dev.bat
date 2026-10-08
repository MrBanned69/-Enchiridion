@echo off
title Iniciando Librería ERP
echo ========================================================
echo Iniciando Librería ERP (MySQL + Backend .NET + Frontend)
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocurrio un error al ejecutar el script.
    pause
)
