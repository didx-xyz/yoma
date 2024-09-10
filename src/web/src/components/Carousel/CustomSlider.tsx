import React, { useRef, useState, useCallback, useEffect } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import styles from "./CustomSlider.module.css";

interface CustomSliderProps {
  children: React.ReactNode;
}

const CustomSlider = ({ children }: CustomSliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  let isDown = false;
  let startX: number;
  let scrollLeft: number;

  const startDrag = (position: number) => {
    isDown = true;
    sliderRef.current!.classList.add(styles.active!);
    startX = position - sliderRef.current!.offsetLeft;
    scrollLeft = sliderRef.current!.scrollLeft;
  };

  const endDrag = () => {
    isDown = false;
    sliderRef.current!.classList.remove(styles.active!);
  };

  const moveDrag = (position: number, sensitivity: number) => {
    if (!isDown) return;
    const x = position - sliderRef.current!.offsetLeft;
    const walk = (x - startX) * sensitivity;
    sliderRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.pageX);
  const handleMouseLeave = endDrag;
  const handleMouseUp = endDrag;
  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    moveDrag(e.pageX, 3);
  };

  const handleTouchStart = (e: React.TouchEvent) =>
    startDrag(e.touches[0]!.pageX);
  const handleTouchEnd = endDrag;
  const handleTouchMove = (e: React.TouchEvent) =>
    moveDrag(e.touches[0]!.pageX, 3);

  const onScrollLeft = useCallback(() => {
    if (sliderRef.current) {
      const newScrollLeft = Math.max(sliderRef.current.scrollLeft - 200, 0);
      sliderRef.current.scrollTo({ left: newScrollLeft });
    }
  }, []);

  const onScrollRight = useCallback(() => {
    if (sliderRef.current) {
      const maxScrollLeft =
        sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      const newScrollLeft = Math.min(
        sliderRef.current.scrollLeft + 200,
        maxScrollLeft,
      );
      sliderRef.current.scrollTo({ left: newScrollLeft });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowPrevButton(scrollLeft > 0);
      setShowNextButton(
        scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth,
      );
    }
  }, []);

  useEffect(() => {
    const sliderElement = sliderRef.current;

    if (sliderElement) {
      sliderElement.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial check

      return () => {
        sliderElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    // use a MutationObserver to detect when the slides are fully loaded.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          handleScroll();
        }
      });
    });

    const sliderElement = sliderRef.current;

    if (sliderElement) {
      observer.observe(sliderElement, { childList: true, subtree: true });
    }

    const handleResize = () => {
      handleScroll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (sliderElement) {
        observer.disconnect();
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll]);

  return (
    <>
      {showPrevButton && (
        <>
          <div className="absolute left-0 top-0 z-10 h-full w-10 backdrop-blur-[0.6px] md:w-12"></div>
          <div className="absolute left-0 top-0 z-20 flex h-full w-10 items-center justify-center md:w-12">
            <button
              type="button"
              onClick={onScrollLeft}
              className="group btn btn-circle btn-sm h-8 w-8 cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black hover:border-orange hover:bg-orange hover:brightness-90 disabled:!cursor-not-allowed md:h-10 md:w-10"
            >
              <MdKeyboardArrowLeft className="text-lg md:text-3xl" />
            </button>
          </div>
        </>
      )}
      <div
        ref={sliderRef}
        className={`flex gap-[2px] overflow-x-auto overflow-y-hidden scroll-smooth whitespace-nowrap ${styles.noscrollbar}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {children}
      </div>
      {showNextButton && (
        <>
          <div className="absolute right-0 top-0 z-10 h-full w-10 backdrop-blur-[0.6px] md:w-12"></div>
          <div className="absolute right-0 top-0 z-20 flex h-full w-10 items-center justify-center md:w-12">
            <button
              type="button"
              onClick={onScrollRight}
              className="group btn btn-circle btn-sm h-8 w-8 cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black delay-300 hover:border-orange hover:bg-orange hover:brightness-90 disabled:!cursor-not-allowed md:h-10 md:w-10"
            >
              <MdKeyboardArrowRight className="text-lg md:text-3xl" />
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default CustomSlider;