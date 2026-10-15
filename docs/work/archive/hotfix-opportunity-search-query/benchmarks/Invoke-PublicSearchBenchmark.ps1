param(
  [Parameter(Mandatory)][ValidateSet('before', 'after')][string]$Phase,
  [Parameter(Mandatory)][string]$OutputPath,
  [string]$ExpectedRelease = 'not supplied'
)

$ErrorActionPreference = 'Stop'
$endpoint = 'https://api.yoma.world/api/v3/opportunity/search'
if (Test-Path -LiteralPath $OutputPath) { throw 'Output exists; choose a new filename to preserve prior evidence.' }
$parent = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $parent)) { throw 'Output parent directory must already exist.' }

$countries = @('bab77522-001d-42cb-a1ee-394e16ee5613', '0efb07e6-6634-46de-a98d-a85bf331c20e')
$cases = @(
  @{ name = 'impact-country-page1'; term = 'impact'; page = 1; states = @(1,0,2); countries = $countries },
  @{ name = 'customer-hold-country-page1'; term = 'customer hold'; page = 1; states = @(1,0,2); countries = $countries },
  @{ name = 'impact-country-page2'; term = 'impact'; page = 2; states = @(1,0,2); countries = $countries },
  @{ name = 'impact-global-page1'; term = 'impact'; page = 1; states = @(1,0); countries = $null },
  @{ name = 'customer-hold-global-page1'; term = 'customer hold'; page = 1; states = @(1,0); countries = $null }
)

function Get-Sha256([string]$Value) {
  [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Value))).ToLowerInvariant()
}

$samples = [Collections.Generic.List[object]]::new()
$report = [ordered]@{
  schemaVersion = 1
  phase = $Phase
  expectedRelease = $ExpectedRelease
  releaseNote = 'Operator-supplied label; not a runtime version assertion.'
  endpoint = $endpoint
  startedUtc = [DateTimeOffset]::UtcNow.ToString('o')
  completedUtc = $null
  method = 'One sequential initial sample followed by three measured samples per fixed case; 1000 ms pause between requests; no authentication, no retries, no concurrency. HeadersMs includes transport/connection and time to response headers, not pure server/SQL time. TotalMs includes reading the full response body, excludes JSON parsing. Server-side caching remains unchanged. Tiny descriptive sample, not a load test.'
  complete = $false
  samples = $samples
  summary = @()
}
$handler = [Net.Http.HttpClientHandler]::new()
$handler.AutomaticDecompression = [Net.DecompressionMethods]::All
$client = [Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(30)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('Yoma-Release-Smoke-Benchmark/1.0')
$client.DefaultRequestHeaders.Accept.ParseAdd('application/json')

try {
  foreach ($case in $cases) {
    $payload = [ordered]@{
      pageNumber = $case.page; pageSize = 12; valueContains = $case.term
      mostViewed = $null; mostCompleted = $null; featured = $null
      publishedStates = $case.states; types = $null; engagementTypes = $null
      categories = $null; countries = $case.countries; languages = $null
      organizations = $null; commitmentInterval = $null; zltoReward = $null
    }
    $body = $payload | ConvertTo-Json -Depth 10 -Compress
    for ($iteration = 0; $iteration -le 3; $iteration++) {
      $request = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post, $endpoint)
      $request.Content = [Net.Http.StringContent]::new($body, [Text.Encoding]::UTF8, 'application/json')
      $response = $null
      $sample = [ordered]@{
        case = $case.name; iteration = $iteration; initial = ($iteration -eq 0)
        startedUtc = [DateTimeOffset]::UtcNow.ToString('o'); payload = $payload
        payloadSha256 = Get-Sha256 $body
        status = $null; headersMs = $null; totalMs = $null; responseBytes = $null
        totalCount = $null; itemCount = $null; ids = @(); titles = @()
        idsSha256 = $null; responseSha256 = $null; resultShapeSha256 = $null
        duplicateIds = $null; serverTiming = $null; age = $null; error = $null
      }
      $timer = [Diagnostics.Stopwatch]::StartNew()
      try {
        $response = $client.SendAsync($request, [Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        $sample.headersMs = [math]::Round($timer.Elapsed.TotalMilliseconds, 2)
        $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $timer.Stop()
        $sample.totalMs = [math]::Round($timer.Elapsed.TotalMilliseconds, 2)
        $sample.status = [int]$response.StatusCode
        $sample.responseBytes = $bytes.Length
        if ($response.Headers.Contains('Server-Timing')) { $sample.serverTiming = $response.Headers.GetValues('Server-Timing') -join ', ' }
        if ($response.Headers.Contains('Age')) { $sample.age = $response.Headers.GetValues('Age') -join ', ' }
        if (-not $response.IsSuccessStatusCode) { throw "HTTP $($sample.status); stopping rather than retrying against production." }
        $text = [Text.Encoding]::UTF8.GetString($bytes)
        $data = $text | ConvertFrom-Json -Depth 100
        if ($null -eq $data.totalCount -or $null -eq $data.items) { throw 'Unexpected search response shape.' }
        $sample.totalCount = $data.totalCount
        $sample.itemCount = @($data.items).Count
        $sample.ids = @($data.items | ForEach-Object { $_.id })
        $sample.titles = @($data.items | ForEach-Object { $_.title })
        $sample.duplicateIds = $sample.ids.Count - @($sample.ids | Sort-Object -Unique).Count
        $sample.idsSha256 = Get-Sha256 ($sample.ids -join "`n")
        $sample.responseSha256 = Get-Sha256 $text
        # Field names only: response values can legitimately change between release windows.
        $shape = @($data.items | ForEach-Object { ($_.PSObject.Properties.Name | Sort-Object) -join ',' }) -join "`n"
        $sample.resultShapeSha256 = Get-Sha256 $shape
        if ($sample.duplicateIds -ne 0 -or $sample.itemCount -gt 12) { throw 'Unexpected duplicate IDs or page size; stop for review.' }
        Write-Output ("{0} sample={1} status={2} headers={3}ms total={4}ms count={5} items={6}" -f $case.name,$iteration,$sample.status,$sample.headersMs,$sample.totalMs,$sample.totalCount,$sample.itemCount)
      } catch {
        $timer.Stop()
        $sample.error = $_.Exception.Message
        if ($null -eq $sample.totalMs) { $sample.totalMs = [math]::Round($timer.Elapsed.TotalMilliseconds, 2) }
        throw
      } finally {
        $samples.Add([pscustomobject]$sample)
        if ($null -ne $response) { $response.Dispose() }
        $request.Dispose()
      }
      Start-Sleep -Milliseconds 1000
    }
  }
  $report.complete = $true
} finally {
  $client.Dispose()
  $handler.Dispose()
  $report.completedUtc = [DateTimeOffset]::UtcNow.ToString('o')
  $report.summary = @(foreach ($case in $cases) {
    $measured = @($samples | Where-Object { $_.case -eq $case.name -and -not $_.initial -and $null -eq $_.error })
    if ($measured.Count -eq 0) { continue }
    $times = @($measured.totalMs | Sort-Object)
    $index = [int][math]::Floor($times.Count / 2)
    $median = if ($times.Count % 2) { $times[$index] } else { ($times[$index - 1] + $times[$index]) / 2 }
    [pscustomobject]@{
      case = $case.name; measuredSamples = $measured.Count
      medianTotalMs = [math]::Round($median,2); minTotalMs = $times[0]; maxTotalMs = $times[-1]
      counts = @($measured.totalCount | Sort-Object -Unique)
      itemCounts = @($measured.itemCount | Sort-Object -Unique)
      stableOrderedIds = (@($measured.idsSha256 | Sort-Object -Unique).Count -eq 1)
    }
  })
  $json = $report | ConvertTo-Json -Depth 30
  [IO.File]::WriteAllText($OutputPath, $json, [Text.UTF8Encoding]::new($false))
  Write-Output "Report saved: $OutputPath"
  $report.summary | Format-Table -AutoSize | Out-String | Write-Output
}
