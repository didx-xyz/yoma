/**
 * Thousands-separated number formatting, space-grouped ("2 473", "150.5") — the one place it
 * lives. Grouped with a no-break space so a figure never wraps; the decimal point stays a point
 * (en-ZA's decimal COMMA, space-replaced, turned a 150.5 partner incentive into "150 5").
 */
export const formatNumber = (value: number): string =>
  value
    .toLocaleString("en-US", { maximumFractionDigits: 4 })
    .replaceAll(",", "\u00a0");

/**
 * "Up to an hour" / "Up to a week" — the commitment-interval label, in the one place both the
 * filter section and the wizard read it from. The article follows the SOUND, not the letter, so
 * the silent-h words are listed: a letter-only rule is what produced "Up to a hour". The list is
 * English spelling, not a custom-field value — nothing here is keyed to a particular interval,
 * and an interval the API adds later still gets a sensible article.
 */
const SILENT_H_WORDS = ["hour", "honest", "heir"];

export const upToIntervalLabel = (intervalName: string): string => {
  const name = intervalName.toLowerCase();
  const soundsLikeVowel =
    "aeiou".includes(name.charAt(0)) ||
    SILENT_H_WORDS.some((word) => name.startsWith(word));
  return `Up to ${soundsLikeVowel ? "an" : "a"} ${name}`;
};
