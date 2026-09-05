import { useEffect, useState } from "react";

/**
 * True below Tailwind's `md` breakpoint — the one place the surface asks JavaScript about the
 * viewport. Density differences are CSS wherever they can be (`md:` variants); this exists for
 * the one case CSS cannot express: the per-type filter sections fold a sub-group HEADING into
 * the field LABEL on small screens, which changes the rendered string, not just its styling.
 *
 * Starts `false` and settles in an effect, so the server and the first client render agree
 * (a `matchMedia` read during render would hydrate one tree and paint another).
 */
const COMPACT_QUERY = "(max-width: 767px)";

export function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const sync = (): void => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return compact;
}
