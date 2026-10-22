# Prepara una copia local de trabajo del launcher LG.
# Copia los ejemplos solo si faltan; no sobrescribe configuración existente.
#
#   powershell -ExecutionPolicy Bypass -File tools\setup.ps1
#   powershell -ExecutionPolicy Bypass -File tools\setup.ps1 -Force

param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $root 'app'

$files = @(
  @{ Example = 'config.example.js'; Target = 'config.js' },
  @{ Example = 'apps.example.js';   Target = 'apps.js' }
)

foreach ($file in $files) {
  $example = Join-Path $appDir $file.Example
  $target = Join-Path $appDir $file.Target

  if (-not (Test-Path $example)) {
    throw "Falta app/$($file.Example)"
  }

  if ($Force -or -not (Test-Path $target)) {
    Copy-Item $example $target -Force
    Write-Host "Creado app/$($file.Target) desde app/$($file.Example)"
  } else {
    Write-Host "Conservado app/$($file.Target)"
  }
}

New-Item -ItemType Directory -Force -Path (Join-Path $appDir 'icons') | Out-Null

Write-Host ''
Write-Host 'Siguiente:'
Write-Host '  1. Edita app\config.js (dock, fondo, Home Assistant).'
Write-Host '  2. Con la TV encendida: tools\sync-apps.ps1 -TvHost TU_TV'
Write-Host '  3. tools\build.ps1'
