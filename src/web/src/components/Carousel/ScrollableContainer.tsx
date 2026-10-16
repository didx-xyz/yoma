import React, { type ReactNode, useRef, useState, useEffect } from "react";

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
  scrollSpeed?: number;
  showShadows?: boolean;
  /**
   * Fade the content itself at an edge with more to scroll, through a CSS mask, instead of a
   * coloured overlay (2026-10-08). For a scroller on a translucent or uneven background, which no
   * `from-*` colour can match (the discovery chip rows). Off by default.
   */
  fadeEdges?: boolean;
  scrollToEndOnChange?: boolean;
  /**
   * Tailwind `from-*` class for the edge-fade shadows — pass the colour of the surface BEHIND
   * the scroller (e.g. `from-purple` on the hero, `from-gray-light` on the page body) so the
   * fade is actually visible. Defaults to the original near-invisible tint, so existing callers
   * are unaffected.
   */
  shadowFromClassName?: string;
  /**
   * Classes for the outer wrapper. Defaults to `h-full` (existing callers unaffected — the
   * Navbar needs it to centre its links in the fixed-height bar). Pass `""` when the scroller
   * sits inside a definite-height flex parent and must NOT stretch to fill it (e.g. an action
   * row at the bottom of a fixed-height dialog).
   */
  containerClassName?: string;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className = "",
  scrollSpeed = 2,
  showShadows = false,
  fadeEdges = false,
  scrollToEndOnChange = false,
  shadowFromClassName = "from-gray-light/5",
  containerClassName = "h-full",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksEdges = showShadows || fadeEdges;
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Check scroll position and update shadow visibility
  const updateShadows = () => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const isAtStart = scrollLeft <= 0;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    setShowLeftShadow(!isAtStart);
    setShowRightShadow(!isAtEnd);
  };

  useEffect(() => {
    if (!tracksEdges) return;

    // Initial check after mount
    updateShadows();

    const handleResize = () => updateShadows();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [tracksEdges]);

  // Separate effect to update shadows when children change
  useEffect(() => {
    if (!tracksEdges) return;
    const timeoutId = setTimeout(updateShadows, 100);
    return () => clearTimeout(timeoutId);
  }, [children, tracksEdges]);

  // Optional behavior: keep the scroller pinned to the far right when content changes.
  useEffect(() => {
    if (!scrollToEndOnChange || !containerRef.current) return;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
      updateShadows();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [children, scrollToEndOnChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = e.currentTarget;
    const target = e.target as HTMLElement;

    // Check if clicking on a link or button
    const isInteractive = target.closest("a, button");

    let isDown = true;
    let hasMoved = false;
    let startX = e.pageX;
    let startY = e.pageY;
    let startScrollLeft = slider.scrollLeft;
    const dragThreshold = 5; // pixels to move before considering it a drag

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      const deltaX = Math.abs(e.pageX - startX);
      const deltaY = Math.abs(e.pageY - startY);

      // Only start dragging if moved beyond threshold
      if (!hasMoved && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        hasMoved = true;
        // If we're on an interactive element and starting to drag, prevent its default behavior
        if (isInteractive) {
          e.preventDefault();
        }
      }

      if (hasMoved) {
        e.preventDefault();
        const walk = (e.pageX - startX) * scrollSpeed;
        slider.scrollLeft = startScrollLeft - walk;
        updateShadows();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDown = false;

      // Prevent link clicks if the user dragged
      if (hasMoved && isInteractive) {
        e.preventDefault();
        e.stopPropagation();
        // Prevent the click event that follows
        const preventClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          slider.removeEventListener("click", preventClick, true);
        };
        slider.addEventListener("click", preventClick, true);
        // Also prevent on the interactive element itself
        if (isInteractive) {
          isInteractive.addEventListener("click", preventClick, true);
          setTimeout(() => {
            isInteractive.removeEventListener("click", preventClick, true);
          }, 10);
        }
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const slider = e.currentTarget;
    const touch = e.touches[0];
    if (!touch) return;

    let startX = touch.clientX;
    let scrollLeft = slider.scrollLeft;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const x = touch.clientX;
      const walk = (startX - x) * scrollSpeed;
      slider.scrollLeft = scrollLeft + walk;
      updateShadows();
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleScroll = () => {
    if (tracksEdges) {
      updateShadows();
    }
  };

  // Only while there is more to scroll: a mask clips whatever lies outside the box, so a row that
  // fits (or wraps, from `md`) is never masked.
  const fade = fadeEdges && (showLeftShadow || showRightShadow);
  const mask = `linear-gradient(to right, ${showLeftShadow ? "transparent" : "black"}, black 2.5rem, black calc(100% - 2.5rem), ${showRightShadow ? "transparent" : "black"})`;
  const edgeMask: React.CSSProperties = fade
    ? { maskImage: mask, WebkitMaskImage: mask }
    : {};

  const defaultClasses = "cursor-grab select-none active:cursor-grabbing";
  const combinedClasses = `${defaultClasses} ${className}`.trim();

  return (
    <div className={`relative ${containerClassName}`.trim()}>
      <div
        ref={containerRef}
        className={`h-full ${combinedClasses}`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          ...edgeMask,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onScroll={handleScroll}
      >
        {children}
      </div>
      {/* Edge fades. Always mounted and faded in or out, rather than mounted on each scroll
          update, which flickered while dragging (2026-10-08). They come AFTER the scroller:
          callers find it as the wrapper's first child (`CustomCarouselV3`). */}
      {showShadows && (
        <div
          aria-hidden
          className={`${shadowFromClassName} pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-12 bg-linear-to-r to-transparent transition-opacity duration-150 motion-reduce:transition-none ${
            showLeftShadow ? "opacity-100" : "opacity-0"
          }`}
        ></div>
      )}
      {showShadows && (
        <div
          aria-hidden
          className={`${shadowFromClassName} pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-12 bg-linear-to-l to-transparent transition-opacity duration-150 motion-reduce:transition-none ${
            showRightShadow ? "opacity-100" : "opacity-0"
          }`}
        ></div>
      )}
    </div>
  );
};

export default ScrollableContainer;
