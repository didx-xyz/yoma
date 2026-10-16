// The measuring behind a line-clamped title's "Show full title" toggle (`DetailHeaderCard`).

/**
 * Whether a line-clamped box actually hides text. A title clamped at exactly as many lines as it
 * has still reports a few pixels of overflow, because Nunito's glyphs overhang a 1.25 line box.
 * So hidden text means more than half a line of overflow.
 */
export const clampHidesText = (
  scrollHeight: number,
  clientHeight: number,
  lineHeight: number,
): boolean => scrollHeight - clientHeight > lineHeight / 2;

/**
 * A computed `line-height` in px. Browsers resolve it to px or `normal`; `normal` (about 1.2) and
 * a bare multiplier are taken against the font size.
 */
export const lineHeightPx = (lineHeight: string, fontSize: string): number => {
  const size = parseFloat(fontSize) || 0;
  const value = parseFloat(lineHeight);
  if (Number.isNaN(value)) return size * 1.2;
  return lineHeight.trim().endsWith("px") ? value : value * size;
};
