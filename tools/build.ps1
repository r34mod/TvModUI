# Empaqueta app/ en un IPK de webOS.
# Version saneada: no contiene rutas ni hosts concretos.
#
#   powershell -ExecutionPolicy Bypass -File tools\build.ps1 `
#     -AresPackage 'C:\ruta\a\ares-package.cmd'

param(
  [string]$AresPackage = 'ares-package'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $root 'app'
$dist = Join-Path $root 'dist'

# Crea config.js y apps.js desde los ejemplos si aún no existen.
& (Join-Path $PSScriptRoot 'setup.ps1')

foreach ($required in @('config.js', 'apps.js')) {
  if (-not (Test-Path (Join-Path $appDir $required))) {
    throw "Falta app/$required. Ejecuta tools\setup.ps1 y revisa la configuración."
  }
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Get-ChildItem $dist -Filter *.ipk -ErrorAction SilentlyContinue |
  Remove-Item -Force

Write-Host "Empaquetando $appDir ..."
& $AresPackage $appDir -o $dist
if ($LASTEXITCODE -ne 0) {
  throw "ares-package falló ($LASTEXITCODE)"
}

$ipk = Get-ChildItem $dist -Filter *.ipk |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $ipk) { throw 'No se generó ningún IPK' }

Write-Host ("IPK: {0}  ({1} bytes)" -f $ipk.FullName, $ipk.Length)
