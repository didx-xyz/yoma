import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  alphabetical,
  countryRank,
  languageRank,
  orderOptions,
  UNRANKED,
} from "./optionOrder";

const language = (name: string, codeAlpha2?: string) => ({
  id: name,
  name,
  codeAlpha2,
});
const names = (items: { name: string }[]) => items.map((item) => item.name);

// The lookup's own spellings (`/lookup/language`), out of order as the facet endpoint returns them.
const LANGUAGES = [
  language("Xhosa", "XH"),
  language("Swahili", "SW"),
  language("Afrikaans", "AF"),
  language("Portuguese", "PT"),
  language("Zulu", "ZU"),
  language("Spanish, Castilian", "ES"),
  language("English", "EN"),
  language("French", "FR"),
  language("Bengali", "BN"),
];

describe("Language and country order (Jason, 2026-10-22)", () => {
  test("collapsed: the five supported languages in the site's order, then the rest A–Z", () => {
    const { collapsed } = orderOptions(LANGUAGES, languageRank);
    assert.deepEqual(names(collapsed), [
      "English",
      "Spanish, Castilian",
      "French",
      "Portuguese",
      "Swahili",
      "Afrikaans",
      "Bengali",
      "Xhosa",
      "Zulu",
    ]);
  });

  test("expanded: everything A–Z, the preferred ones no longer pinned", () => {
    const { expanded } = orderOptions(LANGUAGES, languageRank);
    assert.deepEqual(names(expanded), [
      "Afrikaans",
      "Bengali",
      "English",
      "French",
      "Portuguese",
      "Spanish, Castilian",
      "Swahili",
      "Xhosa",
      "Zulu",
    ]);
  });

  test("a preferred language that is not in the list is simply absent", () => {
    const { collapsed } = orderOptions(
      [language("Zulu", "ZU"), language("French", "FR")],
      languageRank,
    );
    assert.deepEqual(names(collapsed), ["French", "Zulu"]);
  });

  test("language rank: case-insensitive on code and on name; Kiswahili is Swahili", () => {
    assert.equal(languageRank(language("english", "en")), 0);
    assert.equal(languageRank(language("ENGLISH")), 0);
    assert.equal(languageRank(language("Español")), 1);
    assert.equal(languageRank(language("Castilian, Spanish")), 1);
    assert.equal(languageRank(language("Kiswahili", "sw")), 4);
    assert.equal(languageRank(language("Swahili", "SW")), 4);
    assert.equal(languageRank(language("Kiswahili")), 4);
  });

  test("language rank: an unknown name or code falls through", () => {
    assert.equal(languageRank(language("Xhosa", "XH")), UNRANKED);
    assert.equal(languageRank(language("Englishish")), UNRANKED);
    assert.equal(languageRank(language("Pidgin, English-based")), UNRANKED);
  });

  test("the code decides when the name is unfamiliar", () => {
    assert.equal(languageRank(language("Inglés", "EN")), 0);
  });

  test("countries: the youth's own country, then Worldwide, then A–Z", () => {
    const countries = [
      { id: "za", name: "South Africa", codeAlpha2: "ZA" },
      { id: "ke", name: "Kenya", codeAlpha2: "KE" },
      { id: "ww", name: "Worldwide", codeAlpha2: "WW" },
      { id: "ng", name: "Nigeria", codeAlpha2: "NG" },
      { id: "gh", name: "Ghana", codeAlpha2: "GH" },
    ];
    const { collapsed, expanded } = orderOptions(countries, countryRank("ke"));
    assert.deepEqual(names(collapsed), [
      "Kenya",
      "Worldwide",
      "Ghana",
      "Nigeria",
      "South Africa",
    ]);
    assert.deepEqual(names(expanded), [
      "Ghana",
      "Kenya",
      "Nigeria",
      "South Africa",
      "Worldwide",
    ]);
    // No home country: Worldwide alone leads.
    assert.deepEqual(
      names(orderOptions(countries, countryRank(null)).collapsed).slice(0, 2),
      ["Worldwide", "Ghana"],
    );
    assert.equal(
      countryRank(null)({ id: "ww", codeAlpha2: "ww" }),
      1,
      "Worldwide's code matches case-insensitively",
    );
  });

  test("alphabetical is case- and accent-insensitive and leaves the input alone", () => {
    const input = [
      { name: "zulu" },
      { name: "Éwé" },
      { name: "afrikaans" },
      { name: "Ewondo" },
    ];
    assert.deepEqual(names(alphabetical(input)), [
      "afrikaans",
      "Éwé",
      "Ewondo",
      "zulu",
    ]);
    assert.deepEqual(names(input), ["zulu", "Éwé", "afrikaans", "Ewondo"]);
  });
});
