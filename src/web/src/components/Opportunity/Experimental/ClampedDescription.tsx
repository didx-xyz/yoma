import React, { useEffect, useRef, useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { Editor } from "~/components/RichText/Editor";

/** Collapsed height — about eight lines of the description. */
const COLLAPSED_PX = 192;

/**
 * The description, still rendered by the read-only RichText `Editor` — the markdown is never cut.
 * The box is clamped by height and faded out; "Show more" lifts the clamp. The toggle only
 * appears when the content is actually taller than the clamp (measured, and re-measured as the
 * editor renders).
 */
export const ClampedDescription: React.FC<{ value: string }> = ({ value }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

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

  // Clamped from the FIRST render, before it is measured: starting unclamped and clamping once
  // measured shifted everything below by the description's full height.
  const clamped = !expanded;

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={clamped ? { maxHeight: COLLAPSED_PX } : undefined}
      >
        <div ref={contentRef}>
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
          onClick={() => setExpanded((e) => !e)}
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
