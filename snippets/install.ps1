# Instala el IPK en la TV por SSH (dev/install), sin Developer Mode.
# Version saneada: el host se pasa por parámetro y no está escrito aquí.
#
#   $env:TV_HOST = 'IP_DE_LA_TV'
#   powershell -ExecutionPolicy Bypass -File tools\install.ps1 `
#     -TvHost $env:TV_HOST -Launch

param(
  [Parameter(Mandatory = $true)]
  [string]$TvHost,

  [string]$User = 'root',
  [switch]$Launch,
  [string]$Ipk = ''
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

if (-not $Ipk) {
  $Ipk = (Get-ChildItem (Join-Path $root 'dist') -Filter *.ipk |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1).FullName
}

if (-not $Ipk -or -not (Test-Path $Ipk)) {
  throw 'No hay IPK: ejecuta tools\build.ps1'
}

function Invoke-Ssh([string]$Command) {
  $out = & ssh "$User@$TvHost" $Command 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "ssh falló ($LASTEXITCODE): $Command`n$($out -join "`n")"
  }
  return ($out -join "`n")
}

function Send-Json([string]$Json, [string]$RemotePath) {
  $b64 = [Convert]::ToBase64String(
    [Text.Encoding]::UTF8.GetBytes($Json)
  )
  Invoke-Ssh "echo $b64 | base64 -d > $RemotePath" | Out-Null
}

Write-Host "Copiando $([IO.Path]::GetFileName($Ipk)) ..."

& scp $Ipk "${User}@${TvHost}:/tmp/vibehack.ipk" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'scp falló' }

Send-Json `
  '{"id":"com.gathin.tvhome","ipkUrl":"/tmp/vibehack.ipk","subscribe":true}' `
  '/tmp/vibehack-install.json'

Invoke-Ssh @'
rm -f /tmp/vibehack-install.log
ARG=$(cat /tmp/vibehack-install.json)
nohup luna-send -i -f luna://com.webos.appInstallService/dev/install \
  $ARG > /tmp/vibehack-install.log 2>&1 &
echo started
'@ | Out-Null

$installed = $false

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 3
  $log = Invoke-Ssh 'cat /tmp/vibehack-install.log 2>/dev/null'

  if ($log -match '"state"\s*:\s*"installed"') {
    $installed = $true
    break
  }

  if ($log -match '"state"\s*:\s*"failed"') {
    Write-Host $log
    throw 'La instalación falló'
  }
}

if (-not $installed) {
  $log = Invoke-Ssh 'cat /tmp/vibehack-install.log 2>/dev/null'
  Write-Host $log
  throw 'No se confirmó la instalación'
}

Write-Host 'Instalado: com.gathin.tvhome'

if ($Launch) {
  Send-Json '{"id":"com.gathin.tvhome"}' '/tmp/vibehack-launch.json'
  Invoke-Ssh @'
ARG=$(cat /tmp/vibehack-launch.json)
luna-send -n 1 -f luna://com.webos.applicationManager/launch $ARG
'@ | Out-Null
  Write-Host 'Abierto en la TV.'
}

Invoke-Ssh @'
rm -f /tmp/vibehack.ipk /tmp/vibehack-install.json
rm -f /tmp/vibehack-install.log /tmp/vibehack-launch.json
'@ | Out-Null
