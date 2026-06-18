# Genera el ZIP listo para subir al hosting (Hostinger)
$ErrorActionPreference = "Stop"
$raiz = $PSScriptRoot
$backend = Join-Path $raiz "backend-node"
$frontend = Join-Path $raiz "frontend"
$staging = Join-Path $env:TEMP "scrum-ips-deploy"
$zipPath = Join-Path $env:USERPROFILE "Desktop\scrum-ips-deploy-login-fix.zip"

Write-Host "Compilando frontend..." -ForegroundColor Cyan
Push-Location $frontend
if (-not (Test-Path "node_modules")) { npm install }
npm run build
Pop-Location

Write-Host "Preparando carpeta de deploy..." -ForegroundColor Cyan
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

Copy-Item (Join-Path $backend "package.json") $staging
Copy-Item (Join-Path $backend "package-lock.json") $staging -ErrorAction SilentlyContinue
Copy-Item (Join-Path $backend "prisma") (Join-Path $staging "prisma") -Recurse
Copy-Item (Join-Path $backend "src") (Join-Path $staging "src") -Recurse
Copy-Item (Join-Path $frontend "dist") (Join-Path $staging "public") -Recurse

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "ZIP generado:" -ForegroundColor Green
Write-Host "  $zipPath"
Write-Host ""
Write-Host "Contenido:" -ForegroundColor Yellow
Get-ChildItem $staging -Recurse -File | ForEach-Object {
  $_.FullName.Substring($staging.Length + 1)
}
