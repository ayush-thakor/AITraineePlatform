$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$flowLog = Join-Path $projectRoot "flowise_runtime.log"
$flowErr = Join-Path $projectRoot "flowise_runtime.err.log"

$listeners = netstat -ano | Select-String ":3000" | ForEach-Object {
  ($_ -split "\s+")[-1]
} | Sort-Object -Unique

foreach ($pidValue in $listeners) {
  if ($pidValue -match "^\d+$") {
    Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
  }
}

Start-Sleep -Seconds 2

$command = "cmd.exe /d /c `"set FLOWISE_PROXY_KEY=8b7f6c9f2d4e1a3b5c7d0e8f9a1b2c3d&& set HTTP_SECURITY_CHECK=false&& set HTTP_ALLOW_LIST=localhost,127.0.0.1,localhost:3005,host.docker.internal,host.docker.internal:3005&& npx flowise start > `"$flowLog`" 2> `"$flowErr`"`""

$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = $command
  CurrentDirectory = [string]$projectRoot
}

Start-Sleep -Seconds 12

Write-Output "ReturnValue=$($result.ReturnValue)"
Write-Output "ProcessId=$($result.ProcessId)"
netstat -ano | Select-String ":3000"
