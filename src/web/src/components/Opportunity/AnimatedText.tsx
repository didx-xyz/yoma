import { useState, useEffect } from "react";
import { REDUCED_MOTION_QUERY } from "~/features/discovery/state/useCountUp";

interface AnimatedTextProps {
  sentences: string[];
  /**
   * Lines the box reserves below `md` (always one from `md`): 1 where the caller keeps every
   * line under ~40 characters (the Yo-ID hero), 2 for discovery's and the classic page's longer
   * lines, which wrap once on a phone.
   */
  linesBelowMd?: 1 | 2;
}

const FADE_MS = 500;

/**
 * Rotates through `sentences` every 6 s, fading out and in around each swap. Under
 * `prefers-reduced-motion: reduce` the text swaps in place — no fade, no blink (Jason,
 * 2026-10-21): the opacity never changes there.
 *
 * The box has a fixed height at every width (Jason, 2026-10-21): a sentence that runs over is
 * clamped with an ellipsis rather than pushing what sits below it (the Yo-ID chips).
 */
const AnimatedText: React.FC<AnimatedTextProps> = ({
  sentences,
  linesBelowMd = 1,
}) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // A new list (the Yo-ID hero swaps lists per page) starts from its first sentence. Keyed on the
  // text, not the array: callers that build the array inline must not reset it every render.
  const text = sentences.join("\u0000");
  useEffect(() => {
    setIndex(0);
    setFade(true);
  }, [text]);

  useEffect(() => {
    // One sentence has nothing to rotate to: no interval, so it never blinks.
    if (sentences.length < 2) return;
    const advance = (): void =>
      setIndex((prevIndex) => (prevIndex + 1) % sentences.length);
    const reduce = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    let swap: number | undefined;
    const interval = setInterval(() => {
      if (reduce) {
        advance();
        return;
      }
      setFade(false);
      swap = window.setTimeout(() => {
        advance();
        setFade(true);
      }, FADE_MS);
    }, 6000); // Change sentence every 6 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(swap);
    };
  }, [sentences.length]);

  // `line-clamp-*` sets `display: -webkit-box`, which is what clips with an ellipsis here.
  const box =
    linesBelowMd === 2
      ? "h-10 line-clamp-2 md:h-5 md:line-clamp-1"
      : "h-5 line-clamp-1";
  return (
    <div
      className={`text-purple-soft w-full text-center text-sm leading-5 font-normal transition-opacity duration-500 motion-reduce:transition-none ${box} ${
        fade ? "opacity-100" : "opacity-0"
      }`}
    >
      {sentences[index % sentences.length]}
    </div>
  );
};

export default AnimatedText;
