/** Thousands-separated number formatting, space-grouped ("2 473") — the one place it lives. */
export const formatNumber = (value: number): string =>
  value.toLocaleString("en-ZA").replaceAll(",", " ");
