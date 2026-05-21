param(
  [string]$FlowJsonPath = "..\agentic_flow_v2_native_docker.json",
  [int]$FlowPort = 3000,
  [string]$FlowHost = 'localhost',
  [string]$ProxyKey = '8b7f6c9f2d4e1a3b5c7d0e8f9a1b2c3d',
  [string]$AllowList = 'localhost,127.0.0.1,host.docker.internal,localhost:3001'
)

Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

$env:FLOWISE_PROXY_KEY = $ProxyKey
$env:HTTP_ALLOW_LIST = $AllowList

$uiUrl = "http://$FlowHost:$FlowPort"
Write-Host "Using Flowise UI: $uiUrl"
Write-Host "Flow JSON: $FlowJsonPath"

Write-Host "Starting Flowise (npx flowise start) in background..."
$p = Start-Process -FilePath 'npx' -ArgumentList 'flowise start' -NoNewWindow -PassThru

try {
  Write-Host "Waiting for Flowise UI to be available at $uiUrl ..."
  $ok = $false
  for ($i=0; $i -lt 60; $i++) {
    try {
      $r = Invoke-WebRequest -Uri $uiUrl -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { $ok = $true; break }
    } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $ok) { throw "Flowise UI did not become available; check 'npx flowise start' output" }

  Write-Host "Attempting to import flow JSON..."
  $endpoints = @('/api/flows/import','/api/flow/import','/api/flows','/api/flow','/api/import')
  $imported = $false
  foreach ($ep in $endpoints) {
    $url = "$uiUrl$ep"
    Write-Host "Trying import endpoint: $url"
    try {
      $form = @{ file = Get-Item -Path $FlowJsonPath }
      $resp = Invoke-RestMethod -Uri $url -Method Post -Form $form -Headers @{ 'x-flowise-key' = $ProxyKey } -ErrorAction Stop
      Write-Host "Import appears to have succeeded at $url"
      $imported = $true; break
    } catch {}
    try {
      $json = Get-Content -Raw -Path $FlowJsonPath
      $resp = Invoke-RestMethod -Uri $url -Method Post -Body $json -ContentType 'application/json' -Headers @{ 'x-flowise-key' = $ProxyKey } -ErrorAction Stop
      Write-Host "Import appears to have succeeded at $url"
      $imported = $true; break
    } catch {}
  }
  if (-not $imported) {
    Write-Host "Automatic import failed. Please import the flow manually in the Flowise UI: $uiUrl"
    Write-Host "Open Flowise → Import Flow → Upload: $FlowJsonPath"
    $failed = $true
    return
  }
  Write-Host "Flowise has started and the flow has been imported. Close this window to stop Flowise."
} finally {
  if ($failed -and $p -and -not $p.HasExited) { Write-Host 'Stopping Flowise because import failed...'; $p.Kill() }
}
