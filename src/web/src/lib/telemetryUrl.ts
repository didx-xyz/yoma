/**
 * What telemetry may keep of a navigation destination: its origin, nothing more.
 *
 * Partner hand-off links can be pre-authenticated — the path, query or fragment then carries a
 * login token for that youth. The browser needs the full URL to navigate; Datadog and Google
 * Analytics do not, and both retain what they are sent. Null when the value is not an absolute
 * http(s) URL, so a caller can only ever forward an origin or nothing.
 */
export function telemetryOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
