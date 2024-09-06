import React, { useRef, useState, useCallback, useEffect } from "react";
import { useAtomValue } from "jotai";
import { screenWidthAtom } from "~/lib/store";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import styles from "./CustomSlider.module.css";

interface CustomSliderProps<T> {
  children: React.ReactNode;
}

const CustomSlider = <T,>({ children }: CustomSliderProps<T>) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(true);
  const screenWidth = useAtomValue(screenWidthAtom);
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
    moveDrag(e.pageX, 3); // Increased sensitivity
  };

  const handleTouchStart = (e: React.TouchEvent) =>
    startDrag(e.touches[0]!.pageX);
  const handleTouchEnd = endDrag;
  const handleTouchMove = (e: React.TouchEvent) =>
    moveDrag(e.touches[0]!.pageX, 3); // Increased sensitivity

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
    if (sliderRef.current) {
      sliderRef.current.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial check
      return () => {
        if (sliderRef.current) {
          sliderRef.current.removeEventListener("scroll", handleScroll);
        }
      };
    }
  }, [handleScroll]);

  // call handleScroll on resize (atom)
  useEffect(() => {
    handleScroll();
  }, [screenWidth]);

  return (
    <div className="relative flex justify-center">
      {showPrevButton && (
        <>
          <div className="absolute left-0 top-0 z-10 h-full w-12 backdrop-blur-[0.6px]"></div>
          <div className="absolute left-0 top-0 z-20 flex h-full w-12 items-center justify-center">
            <button
              onClick={onScrollLeft}
              className="group btn btn-circle btn-sm h-10 w-10 cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black hover:border-orange hover:bg-orange hover:brightness-90 disabled:!cursor-not-allowed"
            >
              <MdKeyboardArrowLeft className="text-3xl" />
            </button>
          </div>
        </>
      )}
      <div
        ref={sliderRef}
        className={`flex overflow-x-auto scroll-smooth whitespace-nowrap ${styles.noscrollbar}`}
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
          <div className="absolute right-0 top-0 z-10 h-full w-12 backdrop-blur-[0.6px]"></div>
          <div className="absolute right-0 top-0 z-20 flex h-full w-12 items-center justify-center">
            <button
              onClick={onScrollRight}
              className="group btn btn-circle btn-sm h-10 w-10 cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black delay-300 hover:border-orange hover:bg-orange hover:brightness-90 disabled:!cursor-not-allowed"
            >
              <MdKeyboardArrowRight className="text-3xl" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSlider;
