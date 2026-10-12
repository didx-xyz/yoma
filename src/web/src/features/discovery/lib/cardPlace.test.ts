import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { OpportunityCountryInfo } from "~/api/models/opportunity";
import { cardPlace } from "./location";

const country = (
  name: string,
  codeAlpha2: string,
  city: string | null = null,
): OpportunityCountryInfo =>
  ({ id: codeAlpha2, name, codeAlpha2, city }) as OpportunityCountryInfo;

const WW = country("Worldwide", "WW");
const ZA = country("South Africa", "ZA");

describe("cardPlace", () => {
  test("nothing without countries", () => {
    assert.equal(cardPlace({ countries: [], providerCountry: null }), null);
    assert.equal(
      cardPlace({ countries: null, providerCountry: "Kenya" }),
      null,
    );
  });

  test("the first country's city, else its name", () => {
    assert.equal(
      cardPlace({
        countries: [country("South Africa", "ZA", "Cape Town")],
        providerCountry: null,
      }),
      "Cape Town",
    );
    assert.equal(
      cardPlace({ countries: [ZA], providerCountry: "Kenya" }),
      "South Africa",
    );
  });

  test("Worldwide names where its provider is based", () => {
    assert.equal(
      cardPlace({ countries: [WW], providerCountry: "South Africa" }),
      "Worldwide · from South Africa",
    );
    assert.equal(
      cardPlace({ countries: [WW], providerCountry: null }),
      "Worldwide",
    );
  });

  test("older mixed lists still name the Worldwide entry", () => {
    assert.equal(
      cardPlace({ countries: [ZA, WW], providerCountry: "Kenya" }),
      "Worldwide · from Kenya",
    );
  });
});
