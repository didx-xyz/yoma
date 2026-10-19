#!/usr/bin/env node
// Phone OTP dispatch report from Keycloak logs in Datadog.
//
// Counts the log lines written by the phone provider and the Twilio sender before and after a
// release, so the effect of the WhatsApp "sent but not delivered" fix (#1979, #1986) can be read
// from production traffic. Read-only: it only calls Datadog's log search APIs, and prints counts
// and Twilio status/error codes, never log lines (they contain phone numbers).
//
// Usage (from the repo root):
//   DD_API_KEY=… DD_APP_KEY=… mise x -- node src/keycloak/scripts/otp-dispatch-report.mjs [options]
//
// Options:
//   --discover            list the env / namespace / cluster tags on Keycloak logs (last 24 h), to pick --scope
//   --scope <query>       Datadog query that selects production Keycloak logs (default: "service:keycloak env:v3-prod")
//   --release <ISO time>  when the fix reached production (default: 2026-10-19T08:28:34Z, v3.13.2 published)
//   --before-hours <n>    length of the comparison window before the release (default: 24)
//   --to <ISO time|now>   end of the after-release window (default: now)
//   --dry-run             print the queries without calling Datadog
//
// Environment:
//   DD_API_KEY, DD_APP_KEY  required (API key and application key). The application key needs
//                           the logs_read_data permission; a RUM-only key (rum_read) gets 403.
//   DD_SITE                 Datadog site, "datadoghq.eu" or "api.datadoghq.eu" (default: datadoghq.eu)
//   DD_APP_ID               not used by these APIs (the RUM application id); ignored if set
//
// Set the variables with export in the same terminal, e.g.  export DD_APP_KEY='…'

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

// Accept DD_SITE with or without the "api." prefix (datadog-example.ps1 uses "api.datadoghq.eu")
const SITE = (process.env.DD_SITE || "datadoghq.eu")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/^api\./, "");
const API = process.env.DD_API_URL || `https://api.${SITE}`; // DD_API_URL: for testing against a mock
// Pasted keys can carry a trailing newline or carriage return
const API_KEY = (process.env.DD_API_KEY ?? "").trim();
const APP_KEY = (process.env.DD_APP_KEY ?? "").trim();
// Production's env tag is v3-prod (see datadog-example.ps1); --discover lists the values in use
const SCOPE = option("scope", "service:keycloak env:v3-prod");
const RELEASE = new Date(option("release", "2026-10-19T08:28:34Z"));
const BEFORE_HOURS = Number(option("before-hours", "24"));
const TO = option("to", "now") === "now" ? new Date() : new Date(option("to"));
const DRY_RUN = flag("dry-run");

for (const [name, value] of [
  ["--release", RELEASE],
  ["--to", TO],
]) {
  if (Number.isNaN(value.getTime())) fail(`${name} is not a valid time`);
}
if (!(BEFORE_HOURS > 0)) fail("--before-hours must be a positive number");
if (!DRY_RUN && (!API_KEY || !APP_KEY)) fail("set DD_API_KEY and DD_APP_KEY");

const windows = {
  before: { from: new Date(RELEASE.getTime() - BEFORE_HOURS * 3600_000), to: RELEASE },
  after: { from: RELEASE, to: TO },
};

// Log messages written by DefaultPhoneProvider and TwilioSmsSenderServiceProvider.
// "both" = written by v3.13.0 and the fixed version; "old" / "new" = only one of them.
const METRICS = [
  // "code to" keeps out Keycloak's own lines such as "Failed to send email"
  {
    key: "attempts",
    in: "both",
    q: '"Attempting to send" "code to phone"',
    label: "Code requests that reached a send",
  },
  { key: "sent", in: "both", q: '"Successfully sent" "code to"', label: "Sends that succeeded (code saved)" },
  { key: "failed503", in: "both", q: '"Failed to send" "code to"', label: "503: send failed" },
  { key: "rejected400", in: "new", q: '"Cannot send" "code to"', label: "400: number can't be reached" },
  { key: "alreadySent", in: "both", q: '"code already exists"', label: "Refused: a code is still valid" },
  { key: "waConfirmed", in: "new", q: '"WhatsApp delivery confirmed to"', label: "WhatsApp delivered" },
  {
    key: "waUnconfirmed",
    in: "new",
    q: '"WhatsApp dispatch accepted but delivery not confirmed to"',
    label: "Non-ZA: sent, delivery unconfirmed (the fix)",
  },
  { key: "zaBackup", in: "new", q: '"also sending SMS"', label: "ZA: delivery unconfirmed, SMS backup sent" },
  {
    key: "waFailedNonZa",
    in: "new",
    q: '"WhatsApp message failed and SMS is not supported for"',
    label: "Non-ZA: WhatsApp failed, no SMS",
  },
  {
    key: "neverDispatched",
    in: "new",
    q: '"Could not confirm WhatsApp message dispatch after"',
    label: "WhatsApp never left Twilio's queue",
  },
  {
    key: "waFallbackSms",
    in: "both",
    q: '"WhatsApp message failed, falling back to SMS"',
    label: "WhatsApp failed, SMS fallback",
  },
  { key: "smsSent", in: "both", q: '"SMS sent successfully"', label: "SMS sent" },
  { key: "oldWaSuccess", in: "old", q: '"WhatsApp delivery successful to"', label: "Old: WhatsApp delivered" },
  {
    key: "oldTimeout",
    in: "old",
    q: '"Could not confirm WhatsApp message delivery after"',
    label: "Old: no receipt in window (the incident)",
  },
  { key: "plus27Reject", in: "both", q: '"Phone number must start with +27"', label: "Non-ZA number refused SMS" },
  { key: "recordFailed", in: "new", q: '"Could not record failed"', label: "Failed send not counted (expect 0)" },
  {
    key: "crashes",
    in: "new",
    q: '("NonUniqueResultException" OR "AbstractMethodError" OR "NoSuchMethodError")',
    label: "Crash signatures (expect 0)",
  },
];

const query = (q) => `${SCOPE} ${q}`;

async function datadog(path, body, attempt = 1) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": API_KEY,
      "DD-APPLICATION-KEY": APP_KEY,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429 && attempt <= 5) {
    const wait = Number(res.headers.get("x-ratelimit-reset") ?? 10);
    await new Promise((r) => setTimeout(r, Math.max(1, wait) * 1000));
    return datadog(path, body, attempt + 1);
  }
  if (res.status === 403) {
    fail(
      `Datadog ${path} returned 403. The application key (or its user's role) cannot read logs: it needs the logs_read_data permission. A key scoped to rum_read only works for RUM.`,
    );
  }
  if (!res.ok) fail(`Datadog ${path} returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const filter = (q, w) => ({ query: q, from: w.from.toISOString(), to: w.to.toISOString(), indexes: ["*"] });

async function count(q, w) {
  const r = await datadog("/api/v2/logs/analytics/aggregate", {
    compute: [{ aggregation: "count", type: "total" }],
    filter: filter(q, w),
  });
  return (r.data?.buckets ?? []).reduce((n, b) => n + Number(b.computes?.c0 ?? 0), 0);
}

async function groupCount(q, w, facet) {
  const r = await datadog("/api/v2/logs/analytics/aggregate", {
    compute: [{ aggregation: "count", type: "total" }],
    filter: filter(q, w),
    // No "sort" in group_by: Datadog's analytics APIs reject it (400). Sorted below instead.
    group_by: [{ facet, limit: 25 }],
  });
  return (r.data?.buckets ?? [])
    .map((b) => [b.by?.[facet] ?? "(none)", Number(b.computes?.c0 ?? 0)])
    .sort((x, y) => y[1] - x[1]);
}

async function* messages(q, w, max = 10_000) {
  let cursor,
    seen = 0;
  do {
    const r = await datadog("/api/v2/logs/events/search", {
      filter: filter(q, w),
      page: { limit: 1000, ...(cursor ? { cursor } : {}) },
      sort: "timestamp",
    });
    for (const e of r.data ?? []) {
      seen++;
      yield e.attributes?.message ?? "";
    }
    cursor = r.meta?.page?.after;
  } while (cursor && seen < max);
}

// Twilio outcome codes from the failure log lines; the lines themselves are not printed.
// A WhatsApp failure is logged two or three times with the same text; only the first line
// carries the message SID ("WhatsApp message SM…: …"), so only that one is counted.
async function errorCodes(w) {
  const tally = new Map();
  const add = (k) => tally.set(k, (tally.get(k) ?? 0) + 1);
  const q = query('("error code:" OR "Twilio API exception sending SMS" OR "WhatsApp error")');
  for await (const m of messages(q, w)) {
    let match;
    if ((match = m.match(/WhatsApp message \w+: WhatsApp message delivery failed\. Status: (\w+), error code: (\w+)/)))
      add(`WhatsApp ${match[1]}, error ${match[2]}`);
    else if ((match = m.match(/Twilio API exception sending SMS.*Code: (\d+)/))) add(`SMS API error ${match[1]}`);
    else if ((match = m.match(/WhatsApp error (\d+) /))) add(`WhatsApp create error ${match[1]}`);
  }
  return [...tally].sort((a, b) => b[1] - a[1]);
}

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : "-");
const hours = (w) => ((w.to - w.from) / 3600_000).toFixed(1);
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

function fail(message) {
  console.error(`otp-dispatch-report: ${message}`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log(`API ${API}\nbefore ${windows.before.from.toISOString()} → ${windows.before.to.toISOString()}`);
  console.log(`after  ${windows.after.from.toISOString()} → ${windows.after.to.toISOString()}\n`);
  for (const m of METRICS) console.log(`${pad(m.key, 16)} ${query(m.q)}`);
  process.exit(0);
}

if (flag("discover")) {
  const last24h = { from: new Date(Date.now() - 24 * 3600_000), to: new Date() };
  for (const facet of ["env", "kube_namespace", "kube_cluster_name"]) {
    console.log(`\nservice:keycloak logs in the last 24 h by ${facet}:`);
    for (const [value, n] of await groupCount("service:keycloak", last24h, facet))
      console.log(`  ${pad(value, 40)} ${n}`);
  }
  console.log('\nPick the value for production and pass it, e.g. --scope "service:keycloak kube_namespace:<ns>"');
  process.exit(0);
}

console.log(`Scope:  ${SCOPE}`);
console.log(
  `Before: ${windows.before.from.toISOString()} → ${windows.before.to.toISOString()} (${hours(windows.before)} h)`,
);
console.log(
  `After:  ${windows.after.from.toISOString()} → ${windows.after.to.toISOString()} (${hours(windows.after)} h)\n`,
);

const results = {};
for (const m of METRICS) {
  results[m.key] = { before: await count(query(m.q), windows.before), after: await count(query(m.q), windows.after) };
}
if (results.attempts.before + results.attempts.after === 0) {
  console.log("No phone-code sends found in either window. Check --scope with --discover.\n");
}

console.log(`${pad("Log line", 48)} ${pad("Written by", 10)} ${padL("Before", 8)} ${padL("After", 8)}`);
for (const m of METRICS) {
  const r = results[m.key];
  console.log(`${pad(m.label, 48)} ${pad(m.in, 10)} ${padL(r.before, 8)} ${padL(r.after, 8)}`);
}

const a = results.attempts;
console.log("\nPer code request that reached a send:");
console.log(
  `  503 rate                ${padL(pct(results.failed503.before, a.before), 8)} ${padL(pct(results.failed503.after, a.after), 8)}`,
);
console.log(`  400 rate                ${padL("-", 8)} ${padL(pct(results.rejected400.after, a.after), 8)}`);
console.log(
  `  Code saved              ${padL(pct(results.sent.before, a.before), 8)} ${padL(pct(results.sent.after, a.after), 8)}`,
);
console.log(`  Non-ZA unconfirmed      ${padL("-", 8)} ${padL(pct(results.waUnconfirmed.after, a.after), 8)}`);

console.log("\nTwilio failure codes after the release (status, error code: count):");
const codes = await errorCodes(windows.after);
if (codes.length === 0) console.log("  none");
for (const [k, n] of codes) console.log(`  ${pad(k, 40)} ${n}`);
console.log("\nCodes 21211, 21614, 63003 and 63024 return 400; any other failure returns 503.");

const alerts = [];
if (results.recordFailed.after > 0) alerts.push("failed sends were not counted toward the rate limits");
if (results.crashes.after > 0)
  alerts.push("crash signatures found (NonUniqueResultException / AbstractMethodError / NoSuchMethodError)");
if (results.oldWaSuccess.after + results.oldTimeout.after > 0)
  alerts.push(
    "old sender log lines after the release: a replica may still run v3.13.0's JARs, or --release is too early",
  );
if (alerts.length) {
  console.log("\nCheck:");
  for (const s of alerts) console.log(`  - ${s}`);
}
