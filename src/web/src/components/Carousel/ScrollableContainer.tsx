import React, { type ReactNode, useRef, useState, useEffect } from "react";

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
  scrollSpeed?: number;
  showShadows?: boolean;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className = "",
  scrollSpeed = 2,
  showShadows = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
    if (!showShadows) return;

    // Initial check after mount
    updateShadows();

    const handleResize = () => updateShadows();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShadows]);

  // Separate effect to update shadows when children change
  useEffect(() => {
    if (!showShadows) return;
    const timeoutId = setTimeout(updateShadows, 100);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, showShadows]);

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
    if (showShadows) {
      updateShadows();
    }
  };

  const defaultClasses = "cursor-grab select-none active:cursor-grabbing";
  const combinedClasses = `${defaultClasses} ${className}`.trim();

  return (
    <div className="relative">
      {/* Left shadow */}
      {showShadows && showLeftShadow && (
        <div className="from-gray-light/5 backdrop-blur-smx pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent"></div>
      )}

      {/* Right shadow */}
      {showShadows && showRightShadow && (
        <div className="from-gray-light/5 backdrop-blur-smx pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-12 bg-gradient-to-l to-transparent"></div>
      )}

      <div
        ref={containerRef}
        className={combinedClasses}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollableContainer;
