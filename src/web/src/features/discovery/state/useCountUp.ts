import { useLayoutEffect, useRef, useState } from "react";

/**
 * The welcome step's count-up (round 10, 2026-10-02). When the count first resolves it tweens
 * 0 → N over 900ms; when N changes later it tweens from the value on screen over 400ms. Eased
 * expo-out (1 − 2^(−10t), about cubic-bezier(.16, 1, .3, 1)). Plain React and
 * `requestAnimationFrame` — no animation library.
 *
 * Under `prefers-reduced-motion: reduce` there is no counting: N is returned at once.
 *
 * A LAYOUT effect, so the start value replaces the previous one before the browser paints — no
 * frame of N (or of the old number) flashes before the tween begins. Whether the first tween has
 * landed is a ref, not "was anything shown": Strict Mode's mount–unmount–mount leaves a 0 behind,
 * and that must not turn the 900ms first count into the 400ms change.
 */
const FIRST_MS = 900;
const CHANGE_MS = 400;
/** Also read by the dialog's welcome → step 1 transition, at the moment Get started is pressed. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

export function useCountUp(target: number | null): number | null {
  const [shown, setShown] = useState<number | null>(null);
  // The value on screen, so a tween interrupted by a new N continues from where it was.
  const shownRef = useRef<number | null>(null);
  const landedRef = useRef(false);

  useLayoutEffect(() => {
    if (target === null) return;
    const show = (value: number): void => {
      shownRef.current = value;
      setShown(value);
    };

    const from = shownRef.current;
    if (from === target || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      show(target);
      landedRef.current = true;
      return;
    }

    const start = from ?? 0;
    const duration = landedRef.current ? CHANGE_MS : FIRST_MS;
    show(start);
    let frame = 0;
    let startedAt: number | null = null;
    const tick = (now: number): void => {
      startedAt ??= now;
      const t = Math.min(1, (now - startedAt) / duration);
      show(Math.round(start + (target - start) * easeOutExpo(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else landedRef.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}
