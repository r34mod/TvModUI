# Comprueba que el repo no contiene datos privados antes de publicarlo.
#
#   powershell -ExecutionPolicy Bypass -File tools\check-secrets.ps1
#
# Sale con codigo 1 si encuentra algo que revisar.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$errors = 0
$warnings = 0

$skipDirs = @('.git', 'dist', 'build', 'node_modules', '.venv', 'venv', '__pycache__')
$skipExt = @('.png', '.jpg', '.jpeg', '.gif', '.webp', '.ttf', '.otf', '.woff',
  '.woff2', '.ipk', '.wgt', '.appx', '.zip', '.7z', '.pdf', '.ico')

function Fail([string]$path, [string]$line, [string]$message) {
  Write-Host "ERROR  $path`:$line  $message" -ForegroundColor Red
  $script:errors++
}

function Warn([string]$message) {
  Write-Host "AVISO  $message" -ForegroundColor Yellow
  $script:warnings++
}

$files = Get-ChildItem -Path $root -Recurse -File -Force |
  Where-Object {
    $rel = $_.FullName.Substring($root.Length) -replace '^[\\/]+', ''
    $parts = $rel -split '[\\/]'
    $skip = $false
    foreach ($d in $skipDirs) { if ($parts -contains $d) { $skip = $true } }
    (-not $skip) -and ($skipExt -notcontains $_.Extension.ToLowerInvariant())
  }

# IPv4: cualquier direccion, publica o privada, se revisa antes de publicar.
$ipRe = '(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])'
# JWT de Home Assistant u otro servicio.
$jwtRe = 'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}'
# Claves privadas.
$keyRe = '-----BEGIN [A-Z ]*PRIVATE KEY-----'
# token: "..." con valor largo que no sea un placeholder evidente.
$tokenRe = 'token\s*[:=]\s*[''"]([^''"]{16,})[''"]'

foreach ($file in $files) {
  $rel = $file.FullName.Substring($root.Length) -replace '^[\\/]+', ''
  $text = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $text) { continue }

  Select-String -LiteralPath $file.FullName -Pattern $ipRe -AllMatches -ErrorAction SilentlyContinue |
    ForEach-Object { Fail $rel $_.LineNumber "IPv4: $($_.Line.Trim())" }

  Select-String -LiteralPath $file.FullName -Pattern $jwtRe -AllMatches -ErrorAction SilentlyContinue |
    ForEach-Object { Fail $rel $_.LineNumber "posible JWT" }

  Select-String -LiteralPath $file.FullName -Pattern $keyRe -AllMatches -ErrorAction SilentlyContinue |
    ForEach-Object { Fail $rel $_.LineNumber "clave privada" }

  foreach ($m in [regex]::Matches($text, $tokenRe, 'IgnoreCase')) {
    $value = $m.Groups[1].Value
    if ($value -match 'TOKEN_AQUI|YOUR_|REPLACE|PLACEHOLDER|example|ejemplo') { continue }
    $line = ($text.Substring(0, $m.Index) -split "`n").Count
    Fail $rel $line "posible token literal"
  }
}

# Archivos que nunca deben estar en el repo.
$forbidden = @('app/config.js', 'app/apps.js', 'samsung-tizen/app/config.js')
foreach ($f in $forbidden) {
  if (Test-Path (Join-Path $root $f)) {
    Warn "existe $f (local, ignorado por .gitignore; no lo añadas al commit)"
  }
}

Get-ChildItem -Path $root -Recurse -File -Force -Filter *.key |
  ForEach-Object {
    $rel = $_.FullName.Substring($root.Length) -replace '^[\\/]+', ''
    Fail $rel 0 "archivo .key"
  }

# Si ya es un repo git, comprobar que no se han trackeado archivos prohibidos.
if (Test-Path (Join-Path $root '.git')) {
  $tracked = & git -C $root ls-files
  foreach ($f in $tracked) {
    if ($f -match '(^|/)(config\.js|apps\.js)$' -or $f -match '\.(key|pem|p12)$' -or
        $f -match '^dist/' -or $f -match '\.(ipk|wgt)$') {
      Fail $f 0 "archivo prohibido trackeado"
    }
  }
}

Write-Host ''
if ($errors -gt 0) {
  Write-Host "Fallos: $errors. No publiques hasta limpiarlo." -ForegroundColor Red
  exit 1
}

if ($warnings -gt 0) {
  Write-Host "Avisos: $warnings. Revisa los archivos locales antes del commit." -ForegroundColor Yellow
} else {
  Write-Host 'Sin IPs, tokens ni claves detectadas.' -ForegroundColor Green
}
