import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  absoluteWebURL,
  providerFacts,
  providerWebsite,
} from "./providerFacts";

const NONE = {
  provider: null,
  providerURL: null,
  providerLogoURL: null,
  providerCountry: null,
};

describe("absoluteWebURL", () => {
  test("any absolute http(s) link, localhost and query strings included", () => {
    const next =
      "http://localhost:3000/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-light.3f2f3ee7.webp&w=256&q=75";
    assert.equal(absoluteWebURL(next), next);
    assert.equal(
      absoluteWebURL("https://cdn.example.com/a/logo.png"),
      "https://cdn.example.com/a/logo.png",
    );
  });

  test("a typed host gains https", () => {
    assert.equal(absoluteWebURL("www.example.com"), "https://www.example.com");
    assert.equal(
      absoluteWebURL("localhost:3000/logo.png"),
      "https://localhost:3000/logo.png",
    );
  });

  test("blank, spaced and non-web links are refused", () => {
    assert.equal(absoluteWebURL(""), null);
    assert.equal(absoluteWebURL("https://example.com/my logo.png"), null);
    assert.equal(absoluteWebURL("ftp://files.example.com"), null);
    assert.equal(absoluteWebURL("javascript:alert(1)"), null);
  });
});

describe("providerWebsite", () => {
  test("keeps an absolute link and shows its host without www", () => {
    assert.deepEqual(providerWebsite("https://www.kfc.co.za/careers"), {
      href: "https://www.kfc.co.za/careers",
      host: "kfc.co.za",
    });
  });

  test("a typed host gets https, so it never resolves against this site", () => {
    assert.deepEqual(providerWebsite(" example.com "), {
      href: "https://example.com",
      host: "example.com",
    });
  });

  test("blank, unparseable and non-web links give nothing", () => {
    assert.equal(providerWebsite(null), null);
    assert.equal(providerWebsite("  "), null);
    assert.equal(providerWebsite("https://"), null);
    assert.equal(providerWebsite("ftp://files.example.com"), null);
  });
});

describe("providerFacts", () => {
  test("null when nothing names a provider", () => {
    assert.equal(providerFacts(NONE), null);
  });

  test("every part, with where it is based", () => {
    assert.deepEqual(
      providerFacts({
        provider: "KFC",
        providerURL: "https://kfc.co.za",
        providerLogoURL: "https://cdn.example.com/kfc.png",
        providerCountry: "South Africa",
      }),
      {
        name: "KFC",
        website: { href: "https://kfc.co.za", host: "kfc.co.za" },
        logoURL: "https://cdn.example.com/kfc.png",
        basedIn: "Based in South Africa",
      },
    );
  });

  test("with no name, the website's host stands in", () => {
    assert.equal(
      providerFacts({ ...NONE, providerURL: "https://www.alison.com" })?.name,
      "alison.com",
    );
  });

  test("a country alone still shows the card, unnamed", () => {
    const facts = providerFacts({ ...NONE, providerCountry: "Kenya" });
    assert.equal(facts?.name, null);
    assert.equal(facts?.basedIn, "Based in Kenya");
  });
});
