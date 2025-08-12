import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/auth/:path*"],
};

export default function middleware(request: NextRequest) {
  // Build upstream host dynamically with optional env override
  const incomingHostname = request.nextUrl.hostname;
  const envKeycloakHost = process.env.KEYCLOAK_HOSTNAME?.trim();
  const normalizeHost = (h: string) =>
    h
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();

  const baseHost = normalizeHost(envKeycloakHost || incomingHostname);
  const upstreamHost = baseHost.startsWith("keycloak.")
    ? baseHost
    : `keycloak.${baseHost}`;

  const upstream = new URL(
    `https://${upstreamHost}${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const headers = new Headers(request.headers);

  // Resolve client IP without using request.ip
  const priorXFF = headers.get("x-forwarded-for") || "";
  const cfIp = headers.get("cf-connecting-ip");
  const realIp = headers.get("x-real-ip");
  const candidateIp = cfIp || realIp || "";

  const forwardedHost = baseHost.replace(/^keycloak\./, "");
  const proto = request.nextUrl.protocol.replace(/:$/, "") || "https";

  // RFC 7239 Forwarded header
  const forwardedParts = [`host=${forwardedHost}`, `proto=${proto}`];
  if (candidateIp) forwardedParts.unshift(`for=${candidateIp}`);
  headers.set("forwarded", forwardedParts.join(";"));

  // Preserve/append X-Forwarded-For when we have a candidate IP
  if (candidateIp) {
    headers.set(
      "x-forwarded-for",
      priorXFF ? `${priorXFF}, ${candidateIp}` : candidateIp,
    );
  }

  headers.set("x-forwarded-host", forwardedHost);
  headers.set("x-forwarded-proto", proto);

  // Do not override the Host header; let it match the upstream for TLS/SNI
  return NextResponse.rewrite(upstream, {
    request: { headers },
  });
}
