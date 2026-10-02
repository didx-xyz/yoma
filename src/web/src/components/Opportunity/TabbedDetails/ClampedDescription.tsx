import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { Editor } from "~/components/RichText/Editor";

/** Collapsed height — about eight lines of the description. */
const COLLAPSED_PX = 192;

/**
 * The description, still rendered by the read-only RichText `Editor` — the markdown is never cut.
 * The box is clamped by height and faded out; "Show more" lifts the clamp. The toggle only
 * appears when the content is actually taller than the clamp (measured, and re-measured as the
 * editor renders).
 *
 * Round 10 (2026-10-02): Nunito 16/1.7 at a measure of 860px, and the clamp eases open and shut
 * (max-height, 240ms). MDXEditor's own stylesheet is unlayered, so the overrides on its root and
 * content element need `!` to outrank it.
 */
export const ClampedDescription: React.FC<{ value: string }> = ({ value }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  // Clamped from the FIRST render, before it is measured: starting unclamped and clamping once
  // measured shifted everything below by the description's full height. Open, it is `none`, so a
  // later re-flow (a narrower window) is never cut off; in between, the content's height.
  const [maxHeight, setMaxHeight] = useState(`${COLLAPSED_PX}px`);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = (): void =>
      setOverflows(el.scrollHeight > COLLAPSED_PX + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  const toggle = (): void => {
    const content = contentRef.current;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!expanded) {
      setExpanded(true);
      setMaxHeight(reduce || !content ? "none" : `${content.scrollHeight}px`);
      return;
    }
    setExpanded(false);
    if (!reduce && content) {
      // `none` cannot be eased from: pin the full height and flush it first
      flushSync(() => setMaxHeight(`${content.scrollHeight}px`));
      void boxRef.current?.offsetHeight;
    }
    setMaxHeight(`${COLLAPSED_PX}px`);
  };

  const clamped = !expanded;

  return (
    <div>
      <div
        ref={boxRef}
        className="relative overflow-hidden transition-[max-height] duration-240 ease-out motion-reduce:transition-none"
        style={{ maxHeight }}
        onTransitionEnd={(e) => {
          if (
            expanded &&
            e.target === e.currentTarget &&
            e.propertyName === "max-height"
          )
            setMaxHeight("none");
        }}
      >
        <div
          ref={contentRef}
          className="max-w-[860px] [&_.mdxeditor]:[--font-body:var(--font-nunito)]! [&_[contenteditable]]:p-0! [&_[contenteditable]]:text-base [&_[contenteditable]]:leading-[1.7] [&_[contenteditable]]:text-black/85!"
        >
          <Editor value={value} readonly={true} />
        </div>
        {clamped && overflows && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white" />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={toggle}
          className="text-green mt-2 flex items-center gap-1 text-sm font-semibold"
        >
          {expanded ? "Show less" : "Show more"}
          {expanded ? (
            <IoChevronUp className="h-4 w-4" />
          ) : (
            <IoChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};
