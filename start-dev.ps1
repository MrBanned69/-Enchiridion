# =====================================================================
# Script de inicio para Librería ERP (Backend .NET + Frontend Next.js)
# =====================================================================

Write-Host "Verificando servicio MySQL..." -ForegroundColor Cyan
$mysql = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue
if ($mysql -and $mysql.Status -ne "Running") {
    Start-Service -Name "MySQL80"
    Write-Host "Servicio MySQL80 iniciado." -ForegroundColor Green
} else {
    Write-Host "Servicio MySQL80 en ejecucion." -ForegroundColor Green
}

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"
$msbuild = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
$iisexpress = "C:\Program Files\IIS Express\iisexpress.exe"

# 1. Compilar Backend
Write-Host "Compilando Backend ASP.NET Web API..." -ForegroundColor Cyan
& $msbuild "$backendDir\backend.csproj" /t:Build /p:Configuration=Debug /v:m
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al compilar el backend." -ForegroundColor Red
    exit 1
}
Write-Host "Backend compilado exitosamente." -ForegroundColor Green

# 2. Iniciar IIS Express en puerto 5000 si no esta corriendo
$backendRunning = Test-NetConnection -ComputerName 127.0.0.1 -Port 5000 -InformationLevel Quiet
if (-not $backendRunning) {
    Write-Host "Iniciando IIS Express en http://localhost:5000..." -ForegroundColor Cyan
    Start-Process -FilePath $iisexpress -ArgumentList "/path:`"$backendDir`"", "/port:5000" -WindowStyle Minimized
    Start-Sleep -Seconds 2
} else {
    Write-Host "Backend ya esta activo en http://localhost:5000." -ForegroundColor Green
}

# 3. Iniciar Frontend Next.js en puerto 3000
$frontendRunning = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet
if (-not $frontendRunning) {
    Write-Host "Iniciando Frontend Next.js en http://localhost:3000..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd `"$frontendDir`"; npm run dev"
} else {
    Write-Host "Frontend ya esta activo en http://localhost:3000." -ForegroundColor Green
}

Write-Host ""
Write-Host "Todo el sistema esta levantado y conectado:" -ForegroundColor Green
Write-Host "- Base de datos: MySQL (localhost:3306, erp_libreria)" -ForegroundColor White
Write-Host "- Backend API:   http://localhost:5000/api" -ForegroundColor White
Write-Host "- Frontend Web:  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Abriendo http://localhost:3000 en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"
