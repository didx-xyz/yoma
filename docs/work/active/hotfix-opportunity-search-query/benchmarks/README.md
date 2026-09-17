# Public Production search benchmark

## Before release — 2026-09-17

Captured at approximately 06:48–06:51 SAST (04:48–04:51 UTC), from Adrian's machine against the public Production API. No login, provider operations or deployments. Remote current and v3.12.8 still matched the existing production baseline at capture time; the script's expectedRelease is a label, not a runtime version check.

Evidence: [before-20260917.json](before-20260917.json). Exact payloads, UTC timestamps, status codes, response sizes, counts, ordered IDs/titles and hashes are retained for every sample.

| Case | Median full HTTP time | Range of measured times | Total matches | Items |
| --- | ---: | ---: | ---: | ---: |
| impact, SA + Worldwide, page 1 | 11,623.28 ms | 11,617.95–11,646.10 ms | 413 | 12 |
| customer hold, SA + Worldwide, page 1 | 2,730.19 ms | 2,707.12–2,737.53 ms | 0 | 0 |
| impact, SA + Worldwide, page 2 | 11,638.79 ms | 11,617.38–11,641.84 ms | 413 | 12 |
| impact, no country filter, page 1 | 11,380.19 ms | 11,360.08–11,405.72 ms | 483 | 12 |
| customer hold, no country filter, page 1 | 2,718.49 ms | 2,716.68–2,749.10 ms | 0 | 0 |

Country-filtered cases reproduce the original request's publishedStates [1,0,2], South Africa and Worldwide IDs, and page size 12. Global cases use publishedStates [1,0] and countries null as in the supplied Stage requests. They are distinct scenarios, not interchangeable comparisons.

All 20 requests returned HTTP 200. Each case has one initial sample (retained but excluded from medians) plus three measured samples, run sequentially with a one-second pause. All measured counts and ordered IDs stayed stable. The two impact country-filtered pages had no overlapping IDs.

## After release — same method

Do not run until the new Production deployment is confirmed complete. Use the same machine/network where practical. Confirm which release is live separately; the script does not deploy or infer the live version.

From the repo root, run the unchanged script and choose a new output filename:

```powershell
./docs/work/active/hotfix-opportunity-search-query/benchmarks/Invoke-PublicSearchBenchmark.ps1 `
  -Phase after `
  -ExpectedRelease '<actual deployed release>' `
  -OutputPath 'D:/source/Yoma V3/docs/work/active/hotfix-opportunity-search-query/benchmarks/after-20260917.json'
```

It refuses to overwrite earlier evidence, sends only public search requests, runs no concurrent requests, uses a 30-second per-request timeout, and stops without retries on any error. A partial report is saved if it stops.

Compare paired cases only:

1. Confirm both reports complete and each case has three successful measured samples with identical payloadSha256.
2. Compare totalCount, itemCount and ordered IDs, including page-one/page-two overlap. Investigate mismatches; live data and date-based eligibility can legitimately change between windows.
3. Compare median full HTTP milliseconds. Speedup = before median / after median; reduction percent = (before - after) / before * 100. Show the per-case ranges too.
4. Compare resultShapeSha256 as a supplementary top-level item-field check. Full response hashes can change due to mutable counters and are not proof of a regression on their own. These checks do not prove all response values or business semantics identical.

## Interpretation limits

- This is a small descriptive endpoint benchmark, not a load test, percentile/SLA measurement or proof of causal improvement under identical database load.
- Total timing includes request transport, connection setup if needed and response body transfer, but excludes JSON parsing and browser rendering. Headers timing is not pure API or SQL execution time. Do not compare these numbers directly to SQL EXPLAIN timings or browser queueing durations.
- Same HTTP client reused within each run; initial sample per case is excluded consistently. This does not establish cold database/cache behavior. No server-cache settings changed.
- Public endpoint only; no claim about authenticated/admin endpoints.
- The exact rerun and numerical comparison remain outstanding until after release.
