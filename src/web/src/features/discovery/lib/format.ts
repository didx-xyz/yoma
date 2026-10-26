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

const upToIntervalLabel = (intervalName: string): string => {
  const name = intervalName.toLowerCase();
  const soundsLikeVowel =
    "aeiou".includes(name.charAt(0)) ||
    SILENT_H_WORDS.some((word) => name.startsWith(word));
  return `Up to ${soundsLikeVowel ? "an" : "a"} ${name}`;
};

/**
 * A time-commitment choice as every surface offers it: the wizard's pills, the How long filter
 * section and the commitment rail's title all read this ONE list. One bucket per row of
 * `/lookup/timeInterval`, at `count: 1` ("Up to an hour", "Up to a week") — except the Minute
 * row, which is the curated "A few minutes" = 15 minutes (BA R10, Jason, 2026-10-21): "Up to a
 * minute" matched one-minute tasks and little else. Keyed to the interval's NAME, not its id,
 * because the seed changes the ids.
 */
export interface CommitmentBucket {
  intervalId: string;
  count: number;
  label: string;
}

const A_FEW_MINUTES = { interval: "minute", count: 15, label: "A few minutes" };

export const commitmentBucket = (interval: {
  id: string;
  name: string;
}): CommitmentBucket =>
  interval.name.toLowerCase() === A_FEW_MINUTES.interval
    ? {
        intervalId: interval.id,
        count: A_FEW_MINUTES.count,
        label: A_FEW_MINUTES.label,
      }
    : {
        intervalId: interval.id,
        count: 1,
        label: upToIntervalLabel(interval.name),
      };

export const commitmentBuckets = (
  intervals: { id: string; name: string }[],
): CommitmentBucket[] => intervals.map(commitmentBucket);

/**
 * A stored commitment read as the bucket it falls under: a count BELOW its interval's bucket —
 * `{Minute, 1}`, the old "Up to a minute" pill, saved before 2026-10-21 or in an old link — is
 * the bucket (15 minutes), so "A few minutes" is active and 15 is what the request sends. A count
 * at or above it stays as it is ("Up to 3 weeks" still reads and filters as saved); so does a
 * commitment whose interval is not in the lookup (not loaded yet, or unknown).
 */
export const withCommitmentBucket = <
  T extends { intervalId: string; count: number },
>(
  commitment: T,
  intervals: { id: string; name: string }[],
): T => {
  const interval = intervals.find((i) => i.id === commitment.intervalId);
  if (!interval) return commitment;
  const bucket = commitmentBucket(interval);
  return commitment.count < bucket.count
    ? { ...commitment, count: bucket.count }
    : commitment;
};

/**
 * The label of a stored commitment (a filter, a preference, a URL): its bucket's when it is one,
 * else spelt out — "Up to 3 weeks" from an older link or preference.
 */
export const commitmentLabel = (
  commitment: { intervalId: string; count: number },
  intervalName: string,
): string => {
  const bucket = commitmentBucket({
    id: commitment.intervalId,
    name: intervalName,
  });
  if (commitment.count === bucket.count) return bucket.label;
  return commitment.count === 1
    ? upToIntervalLabel(intervalName)
    : `Up to ${commitment.count} ${intervalName.toLowerCase()}s`;
};
