# Sincroniza apps, iconos y entradas desde la TV por SSH.
# Version saneada: el host se pasa por parámetro y no está escrito aquí.
#
#   $env:TV_HOST = 'IP_DE_LA_TV'
#   powershell -ExecutionPolicy Bypass -File tools\sync-apps.ps1 `
#     -TvHost $env:TV_HOST

param(
  [Parameter(Mandatory = $true)]
  [string]$TvHost,

  [string]$User = 'root'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $root 'app'
$iconDir = Join-Path $appDir 'icons'

New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

function Invoke-Ssh([string]$Command) {
  $out = & ssh "$User@$TvHost" $Command 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "ssh falló ($LASTEXITCODE): $Command`n$($out -join "`n")"
  }
  return ($out -join "`n")
}

function Get-Json([string]$Text) {
  $start = $Text.IndexOf('{')
  $end = $Text.LastIndexOf('}')
  if ($start -lt 0 -or $end -le $start) {
    throw "Respuesta sin JSON: $Text"
  }
  return ($Text.Substring($start, $end - $start + 1) | ConvertFrom-Json)
}

# En webOS 5 luna-send puede no aceptar -w; se reintenta sin ese flag.
# La salida se pasa por base64 para conservar UTF-8.
function Invoke-Luna([string]$Uri, [string]$Payload = '{}', [int]$Wait = 6000) {
  try {
    $b64 = Invoke-Ssh "luna-send -i -n 1 -w $Wait -f '$Uri' '$Payload' | base64 | tr -d '\n'"
  } catch {
    $b64 = Invoke-Ssh "luna-send -i -n 1 -f '$Uri' '$Payload' | base64 | tr -d '\n'"
  }

  $b64 = ($b64 -replace '\s', '')
  if (-not $b64) { throw 'Respuesta vacía de luna-send' }

  return [Text.Encoding]::UTF8.GetString(
    [Convert]::FromBase64String($b64)
  )
}

function Get-IconBytes([string]$Url) {
  $path = $null

  if ($Url -match '^file://') {
    $path = [System.Uri]::UnescapeDataString($Url.Substring(7))
  } elseif ($Url -match '^[a-zA-Z]+://') {
    $path = $null
  } else {
    $path = [System.Uri]::UnescapeDataString($Url)
  }

  if ($path) {
    $b64 = Invoke-Ssh "base64 '$path' | tr -d '\n'"
  } else {
    # URL http(s): se descarga desde la propia TV.
    $b64 = Invoke-Ssh "wget -q -O - '$Url' | base64 | tr -d '\n'"
  }

  $b64 = ($b64 -replace '\s', '')
  if (-not $b64) { throw 'Icono vacío' }

  return [Convert]::FromBase64String($b64)
}

function Safe-Name([string]$Id) {
  return (($Id -replace '[^A-Za-z0-9._-]', '_') + '.png')
}

Write-Host "Leyendo apps de la TV ..."

$raw = Invoke-Luna `
  'luna://com.webos.applicationManager/listLaunchPoints' '{}' 6000

$lp = Get-Json $raw
$points = @($lp.launchPoints)

Write-Host "  $($points.Count) launch points"

# Entradas externas: probar varios URI según la versión de webOS.
$inputs = @()

foreach ($uri in @(
    'luna://com.webos.service.apiadapter/tv/getExternalInputList',
    'luna://com.webos.service.eim/getAllInputStatus',
    'luna://com.webos.service.eim/getExternalInputList'
  )) {
  try {
    $res = Get-Json (Invoke-Luna $uri '{}' 4000)
    if ($res.devices) {
      foreach ($d in @($res.devices)) {
        if ($d.appId) {
          $label = $d.label
          if (-not $label) { $label = $d.id }
          $inputs += [ordered]@{ appId = $d.appId; label = $label }
        }
      }
      Write-Host "  entradas: $($inputs.Count)"
      break
    }
  } catch {
    # siguiente URI
  }
}

$apps = @()
$failed = 0

foreach ($p in $points) {
  if (-not $p.id) { continue }
  if ($p.hidden -eq $true -or $p.hidden -eq 'true') { continue }

  $name = Safe-Name $p.id
  $dest = Join-Path $iconDir $name
  $icon = $null

  if ($p.largeIcon) { $icon = $p.largeIcon }
  elseif ($p.icon) { $icon = $p.icon }

  if ($icon) {
    try {
      [IO.File]::WriteAllBytes($dest, (Get-IconBytes $icon))
    } catch {
      $failed++
      Write-Host "  sin icono: $($p.id) -> $($_.Exception.Message)"
      continue
    }
  } else {
    $failed++
    Write-Host "  sin icono: $($p.id) (launch point sin icon)"
    continue
  }

  $color = $p.iconColor
  if (-not $color) { $color = $p.bgColor }
  if (-not $color) { $color = '' }

  $apps += [ordered]@{
    id        = $p.id
    title     = [string]$p.title
    icon      = 'icons/' + $name
    iconColor = [string]$color
  }
}

# TV en directo no sale en listLaunchPoints: se añade a mano.
$ltvIcon = '/usr/palm/applications/com.webos.app.livetv/assets/icon_livetv_130.png'
$ltvName = 'com.webos.app.livetv.png'

try {
  [IO.File]::WriteAllBytes(
    (Join-Path $iconDir $ltvName),
    (Get-IconBytes $ltvIcon)
  )

  $apps = @([ordered]@{
    id        = 'com.webos.app.livetv'
    title     = 'TV en directo'
    icon      = 'icons/' + $ltvName
    iconColor = '#6a7c73'
  }) + $apps

  Write-Host '  añadida TV en directo'
} catch {
  Write-Warning "No se pudo añadir TV en directo: $($_.Exception.Message)"
}

$payload = [ordered]@{ apps = $apps; inputs = $inputs }
$js = "// Generado por tools/sync-apps.ps1`nwindow.TV_APPS = " +
  ($payload | ConvertTo-Json -Depth 6 -Compress) + ";`n"

[IO.File]::WriteAllText(
  (Join-Path $appDir 'apps.js'),
  $js,
  (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "OK: $($apps.Count) apps, $($inputs.Count) entradas, $failed sin icono."
Write-Host "Siguiente: powershell -File tools\build.ps1"
