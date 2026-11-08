<#
.SYNOPSIS
Resets an existing standalone local Kind deployment without managing Yoma.
.DESCRIPTION
Requires an already configured Linux development container and privately supplied
bootstrap/start scripts. Only the explicitly named Kind cluster is deleted; its
cluster-local data is lost. External volumes and remote services are not reset.
Use -WhatIf to validate prerequisites without stopping or deleting anything.
#>
#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9_.-]*$')]
    [string]$DevelopmentContainer,

    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z0-9][a-z0-9-]*$')]
    [string]$ClusterName,

    [Parameter(Mandatory)]
    [ValidatePattern('^/[a-zA-Z0-9_./-]+$')]
    [string]$RepositoryPath,

    [Parameter(Mandatory)]
    [ValidatePattern('^/[a-zA-Z0-9_./-]+$')]
    [string]$BootstrapScript,

    [Parameter(Mandatory)]
    [ValidatePattern('^/[a-zA-Z0-9_./-]+$')]
    [string]$StartScript,

    [ValidateRange(1024, 65535)]
    [int]$TiltPort = 10350
)

$ErrorActionPreference = 'Stop'
# Preserve embedded quotes in bash and Docker template arguments, even if the profile selects Legacy.
$PSNativeCommandArgumentPassing = 'Standard'
Get-Command docker -ErrorAction Stop | Out-Null

# Require a local Docker endpoint; never reset a remote Docker context by accident.
$dockerEndpoint = $env:DOCKER_HOST
if ($env:DOCKER_CONTEXT -or -not $dockerEndpoint) {
    $dockerEndpoint = & docker context inspect --format '{{.Endpoints.docker.Host}}' 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the active Docker context.' }
}
if ($dockerEndpoint -notmatch '^(npipe|unix)://') {
    throw 'Reset requires a local Docker socket or named pipe.'
}

$nodeName = "$ClusterName-control-plane"
$actualCluster = & docker inspect $nodeName --format '{{index .Config.Labels "io.x-k8s.kind.cluster"}}' 2>$null
if ($LASTEXITCODE -ne 0 -or $actualCluster -ne $ClusterName) {
    throw 'The named local Kind control-plane container was not found or its cluster label differs.'
}

$running = & docker inspect $DevelopmentContainer --format '{{.State.Running}}' 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne 'true') {
    throw 'The separately managed development container must already be running.'
}

# All paths are container paths. Pass arguments separately instead of evaluating shell input.
$preflight = @'
set -euo pipefail
command -v mise >/dev/null
command -v pgrep >/dev/null
test -r "$1"
test -r "$2"
eval "$(mise env --shell bash)"
command -v kind >/dev/null
kind get clusters | grep -Fxq -- "$3"
'@
& docker exec -w $RepositoryPath $DevelopmentContainer bash -c ($preflight.Replace("`r", '')) -- $BootstrapScript $StartScript $ClusterName 2>$null
if ($LASTEXITCODE -ne 0) {
    throw 'Prerequisites failed. Verify the private standalone setup, script paths, tooling and named cluster.'
}

if (-not $PSCmdlet.ShouldProcess("local Kind cluster '$ClusterName'", 'Stop Tilt, delete cluster data, bootstrap and restart Tilt')) {
    return
}

# Bootstrap output may contain environment details. Keep it outside the repository/console.
$logPath = Join-Path ([System.IO.Path]::GetTempPath()) ("yoma-local-reset-{0}.log" -f [guid]::NewGuid().ToString('N'))
$reset = @'
set -euo pipefail
eval "$(mise env --shell bash)"
pattern="^tilt up .*--port $1( |$)"
for pid in $(pgrep -f "$pattern" || true); do kill -INT "$pid"; done
for attempt in $(seq 1 30); do
    if ! pgrep -f "$pattern" >/dev/null; then break; fi
    sleep 1
done
if pgrep -f "$pattern" >/dev/null; then
    echo 'Tilt did not stop; reset cancelled.' >&2
    exit 1
fi
# Abort if another Tilt instance remains in this dedicated development container.
if pgrep -f '^tilt up( |$)' >/dev/null; then
    echo 'Another Tilt process remains; reset cancelled.' >&2
    exit 1
fi
kind delete cluster --name "$2"
bash "$3"
'@
& docker exec -w $RepositoryPath $DevelopmentContainer bash -c ($reset.Replace("`r", '')) -- $TiltPort $ClusterName $BootstrapScript *> $logPath
if ($LASTEXITCODE -ne 0) {
    throw "Reset/bootstrap failed. Inspect the private log locally: $logPath"
}

& docker exec -d -w $RepositoryPath $DevelopmentContainer bash $StartScript 2>> $logPath
if ($LASTEXITCODE -ne 0) {
    throw "Could not launch the standalone start script. Inspect the private log locally: $logPath"
}

Write-Output 'Reset completed and startup launched; service readiness is not yet verified.'
Write-Output 'Complete the standalone readiness/issuer preparation before starting Yoma initialization.'
Write-Output "Private reset log (do not commit or share unredacted): $logPath"
