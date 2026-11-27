
# ============================================================
# MOBILITY AIDS - Start All Services
# SENA ADSO Academic Recovery
# ============================================================

$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MOBILITY AIDS - STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verify project directories
$RequiredFolders = @("page", "app", "api")

foreach ($Folder in $RequiredFolders) {
    if (!(Test-Path (Join-Path $ProjectRoot $Folder))) {
        Write-Host "ERROR: Folder '$Folder' was not found." -ForegroundColor Red
        exit 1
    }
}

# Verify public website entry point
$PublicIndex = Join-Path $ProjectRoot "page\index.html"

if (!(Test-Path $PublicIndex)) {
    Write-Host "ERROR: page/index.html was not found." -ForegroundColor Red
    Write-Host "Check that the public website is in the correct folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Project folders verified." -ForegroundColor Green
Write-Host "[OK] Public website index.html found." -ForegroundColor Green

# 1. Public website
Write-Host "[1/3] Starting public website..." -ForegroundColor Cyan

Start-Process powershell.exe `
    -WorkingDirectory (Join-Path $ProjectRoot "page") `
    -ArgumentList '-NoExit', '-Command', 'python -m http.server 4177 --bind 0.0.0.0'

# 2. React application
Write-Host "[2/3] Starting React application..." -ForegroundColor Cyan

Start-Process powershell.exe `
    -WorkingDirectory (Join-Path $ProjectRoot "app") `
    -ArgumentList '-NoExit', '-Command', 'npm run dev -- --host 0.0.0.0'

# 3. Laravel API
Write-Host "[3/3] Starting Laravel API..." -ForegroundColor Cyan

Start-Process powershell.exe `
    -WorkingDirectory (Join-Path $ProjectRoot "api") `
    -ArgumentList '-NoExit', '-Command', 'php artisan serve --host=127.0.0.1 --port=8000'

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       MOBILITY AIDS IS STARTING" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "Public website: http://localhost:4177/"
Write-Host "Administrator:  Check the Vite terminal for the actual URL (default port: 5173)."
Write-Host "Login:          Open the actual Vite URL followed by /login."
Write-Host "Laravel API:    http://127.0.0.1:8000"

Write-Host ""
Write-Host "Keep all three server windows open." -ForegroundColor Yellow
