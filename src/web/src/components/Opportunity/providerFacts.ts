import type { OpportunityInfo } from "~/api/models/opportunity";

/**
 * The provider as the details page shows it (2026-10-11): name, website, logo and where it is
 * based. Pure, so node:test can load it. None of it is the owning organisation.
 */
export interface ProviderFacts {
  /** The name, else the website's host; null when neither is known. */
  name: string | null;
  website: { href: string; host: string } | null;
  logoURL: string | null;
  /** "Based in South Africa". */
  basedIn: string | null;
}

/**
 * A provider link as the API stores it: absolute http(s) (`Uri.IsWellFormedUriString`), so a
 * typed "example.com" gains https:// rather than resolving against this site. Any host is fine,
 * localhost and query strings included. Null when blank or not a web link (no whitespace either:
 * the API rejects it).
 */
export function absoluteWebURL(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const href = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return parsed.hostname ? href : null;
  } catch {
    return null;
  }
}

/** The website as a link, with the host to show. */
export function providerWebsite(
  url: string | null | undefined,
): ProviderFacts["website"] {
  const href = absoluteWebURL(url);
  if (!href) return null;
  return { href, host: new URL(href).host.replace(/^www\./, "") };
}

/** Null when the opportunity names no provider at all. */
export function providerFacts(
  opportunity: Pick<
    OpportunityInfo,
    "provider" | "providerURL" | "providerLogoURL" | "providerCountry"
  >,
): ProviderFacts | null {
  const website = providerWebsite(opportunity.providerURL);
  const name = opportunity.provider?.trim() || website?.host || null;
  const logoURL = opportunity.providerLogoURL?.trim() || null;
  const basedIn = opportunity.providerCountry
    ? `Based in ${opportunity.providerCountry}`
    : null;
  if (!name && !logoURL && !basedIn) return null;
  return { name, website, logoURL, basedIn };
}
