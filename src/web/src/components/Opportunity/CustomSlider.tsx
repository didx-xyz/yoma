// import React, { useRef, useState, useEffect } from "react";
// import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";
// import styles from "./CustomSlider.module.css";
// import { OpportunityCategory } from "~/api/models/opportunity";
// import { screenWidthAtom } from "~/lib/store";
// import { useAtomValue } from "jotai";

// interface CustomSliderProps {
//   lookups_categories: OpportunityCategory[];
//   selected_categories: string[] | null | undefined;
//   onClick?: (item: OpportunityCategory) => void;
// }

// const CustomSlider: React.FC<CustomSliderProps> = ({
//   lookups_categories,
//   selected_categories,
//   onClick,
// }) => {
//   const sliderRef = useRef<HTMLDivElement>(null);
//   const [showPrevButton, setShowPrevButton] = useState(false);
//   const [showNextButton, setShowNextButton] = useState(true);
//   const screenWidth = useAtomValue(screenWidthAtom);
//   let isDown = false;
//   let startX: number;
//   let scrollLeft: number;

//   const startDrag = (position: number) => {
//     isDown = true;
//     sliderRef.current!.classList.add(styles.active!);
//     startX = position - sliderRef.current!.offsetLeft;
//     scrollLeft = sliderRef.current!.scrollLeft;
//   };

//   const endDrag = () => {
//     isDown = false;
//     sliderRef.current!.classList.remove(styles.active!);
//   };

//   const moveDrag = (position: number, sensitivity: number) => {
//     if (!isDown) return;
//     const x = position - sliderRef.current!.offsetLeft;
//     const walk = (x - startX) * sensitivity;
//     sliderRef.current!.scrollLeft = scrollLeft - walk;
//   };

//   const handleMouseDown = (e: React.MouseEvent) => startDrag(e.pageX);
//   const handleMouseLeave = endDrag;
//   const handleMouseUp = endDrag;
//   const handleMouseMove = (e: React.MouseEvent) => {
//     e.preventDefault();
//     moveDrag(e.pageX, 1.5);
//   };

//   const handleTouchStart = (e: React.TouchEvent) =>
//     startDrag(e.touches[0]!.pageX);
//   const handleTouchEnd = endDrag;
//   const handleTouchMove = (e: React.TouchEvent) =>
//     moveDrag(e.touches[0]!.pageX, 1.5);

//   const onScrollLeft = () => {
//     if (sliderRef.current) {
//       const newScrollLeft = Math.max(sliderRef.current.scrollLeft - 200, 0);
//       sliderRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
//     }
//   };

//   const onScrollRight = () => {
//     if (sliderRef.current) {
//       const maxScrollLeft =
//         sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
//       const newScrollLeft = Math.min(
//         sliderRef.current.scrollLeft + 200,
//         maxScrollLeft,
//       );
//       sliderRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
//     }
//   };

//   const handleScroll = () => {
//     if (sliderRef.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
//       setShowPrevButton(scrollLeft > 0);
//       setShowNextButton(
//         scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth,
//       );
//     }
//   };

//   useEffect(() => {
//     if (sliderRef.current) {
//       sliderRef.current.addEventListener("scroll", handleScroll);
//       handleScroll(); // Initial check
//       return () => {
//         if (sliderRef.current) {
//           sliderRef.current.removeEventListener("scroll", handleScroll);
//         }
//       };
//     }
//   }, []);

//   // call handleScroll on resize (atom)
//   useEffect(() => {
//     console.warn("screenWidth", screenWidth);
//     handleScroll();
//   }, [screenWidth]);

//   return (
//     <div className="relative flex justify-center">
//       {showPrevButton && (
//         <>
//           <div className="absolute left-0 top-0 z-10 h-full w-12 backdrop-blur-[0.6px]"></div>
//           <div className="absolute left-0 top-0 z-20 flex h-full w-12 items-center justify-center">
//             <button
//               onClick={onScrollLeft}
//               className="group btn btn-circle btn-sm absolute left-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 transform cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black transition-all duration-500 ease-bounce animate-in fade-in hover:border-orange hover:bg-orange hover:brightness-90 active:animate-bounce disabled:!cursor-not-allowed"
//             >
//               <svg
//                 className="mr-[2px] h-[45%] w-[45%] transform text-black transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
//                 viewBox="0 0 532 532"
//               >
//                 <path
//                   fill="currentColor"
//                   stroke="currentColor"
//                   strokeWidth="45"
//                   d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
//                 />
//               </svg>
//             </button>
//           </div>
//         </>
//       )}
//       <div
//         ref={sliderRef}
//         className={`flex overflow-x-auto scroll-smooth whitespace-nowrap ${styles.noscrollbar}`}
//         onMouseDown={handleMouseDown}
//         onMouseLeave={handleMouseLeave}
//         onMouseUp={handleMouseUp}
//         onMouseMove={handleMouseMove}
//         onTouchStart={handleTouchStart}
//         onTouchEnd={handleTouchEnd}
//         onTouchMove={handleTouchMove}
//       >
//         {lookups_categories.map((item, index) => (
//           <div
//             key={`categories_${index}`}
//             className="mx-[2px] inline-block select-none"
//           >
//             <OpportunityCategoryHorizontalCard
//               key={`categories_${item.id}`}
//               data={item}
//               selected={selected_categories?.includes(item.name)}
//               onClick={onClick}
//             />
//           </div>
//         ))}
//       </div>
//       {showNextButton && (
//         <>
//           <div className="absolute right-0 top-0 z-10 h-full w-12 backdrop-blur-[0.6px]"></div>
//           <div className="absolute right-0 top-0 z-20 flex h-full w-12 items-center justify-center">
//             <button
//               onClick={onScrollRight}
//               className="group btn btn-circle btn-sm absolute right-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 transform cursor-pointer border-[1.5px] border-orange bg-orange px-2 text-black transition-all duration-500 ease-bounce animate-in fade-in hover:border-orange hover:bg-orange hover:brightness-90 active:animate-bounce disabled:!cursor-not-allowed"
//             >
//               <svg
//                 className="ml-[2px] h-[45%] w-[45%] transform text-black transition-all duration-500 ease-bounce disabled:bg-gray-light group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
//                 viewBox="0 0 532 532"
//               >
//                 <path
//                   fill="currentColor"
//                   stroke="currentColor"
//                   strokeWidth="45"
//                   d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
//                 />
//               </svg>
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//     // <div className="relative">
//     //   {showPrevButton && (
//     //     <button
//     //       onClick={onScrollLeft}
//     //       //className="bg-orange-500 hover:bg-orange-600 animate-fade-in absolute left-0 top-1/2 z-10 h-12 w-12 -translate-y-1/2 transform px-2"
//     //       className="animate-fade-in group btn btn-circle btn-sm absolute left-0 top-1/2 z-10 h-12 w-12 -translate-y-1/2 transform cursor-pointer border-[1.5px] border-orange bg-gray-light px-2 text-black transition-all duration-500 ease-bounce disabled:!cursor-not-allowed md:h-8 md:w-8 xl:hover:scale-110"
//     //     >
//     //       <svg
//     //         className="mr-[2px] h-[45%] w-[45%] transform text-orange transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
//     //         viewBox="0 0 532 532"
//     //       >
//     //         <path
//     //           fill="currentColor"
//     //           stroke="currentColor"
//     //           strokeWidth="45"
//     //           d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
//     //         />
//     //       </svg>
//     //     </button>
//     //   )}
//     //   <div
//     //     ref={sliderRef}
//     //     className={`flex overflow-x-auto scroll-smooth whitespace-nowrap ${styles.noscrollbar}`}
//     //     onMouseDown={handleMouseDown}
//     //     onMouseLeave={handleMouseLeave}
//     //     onMouseUp={handleMouseUp}
//     //     onMouseMove={handleMouseMove}
//     //     onTouchStart={handleTouchStart}
//     //     onTouchEnd={handleTouchEnd}
//     //     onTouchMove={handleTouchMove}
//     //   >
//     //     {lookups_categories.map((item, index) => (
//     //       <div
//     //         key={`categories_${index}`}
//     //         className="mx-[2px] inline-block select-none"
//     //       >
//     //         <OpportunityCategoryHorizontalCard
//     //           key={`categories_${item.id}`}
//     //           data={item}
//     //           selected={selected_categories?.includes(item.name)}
//     //           onClick={onClick}
//     //         />
//     //       </div>
//     //     ))}
//     //   </div>
//     //   {showNextButton && (
//     //     <button
//     //       onClick={onScrollRight}
//     //       //className="bg-orange-500 hover:bg-orange-600 animate-fade-in absolute right-0 top-1/2 z-10 h-12 w-12 -translate-y-1/2 transform px-2"
//     //       className="animate-fade-in group btn btn-circle btn-sm absolute right-0 top-1/2 z-10 h-12 w-12 -translate-y-1/2 transform cursor-pointer border-[1.5px] border-orange bg-gray-light px-2 text-black transition-all duration-500 ease-bounce disabled:!cursor-not-allowed md:h-8 md:w-8 xl:hover:scale-110"
//     //     >
//     //       <svg
//     //         className="ml-[2px] h-[45%] w-[45%] transform text-orange transition-all duration-500 ease-bounce disabled:bg-gray-light group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
//     //         viewBox="0 0 532 532"
//     //       >
//     //         <path
//     //           fill="currentColor"
//     //           stroke="currentColor"
//     //           strokeWidth="45"
//     //           d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
//     //         />
//     //       </svg>
//     //     </button>
//     //   )}
//     // </div>
//   );
// };

// export default CustomSlider;

import React, { useRef, useState, useEffect, useCallback } from "react";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";
import styles from "./CustomSlider.module.css";
import { useAtomValue } from "jotai";
import { OpportunityCategory } from "~/api/models/opportunity";
import { screenWidthAtom } from "~/lib/store";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

interface CustomSliderProps {
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  lookups_categories,
  selected_categories,
  onClick,
}) => {
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
        {lookups_categories.map((item, index) => (
          <div
            key={`categories_${index}`}
            className="mx-[2px] inline-block select-none"
          >
            <OpportunityCategoryHorizontalCard
              key={`categories_${item.id}`}
              data={item}
              selected={selected_categories?.includes(item.name)}
              onClick={onClick}
            />
          </div>
        ))}
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
