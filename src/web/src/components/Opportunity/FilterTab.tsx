import React, { useState, useEffect } from "react";
import { IoMdOptions } from "react-icons/io";

export interface InputProps {
  openFilter: (filterFullWindowVisible: boolean) => void;
}

const FilterTab: React.FC<InputProps> = ({ openFilter }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 185) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed top-16 z-30 flex h-10 w-[8rem] cursor-pointer items-center justify-center gap-2 rounded-b-lg bg-orange text-center text-sm font-semibold tracking-wide text-white transition-opacity duration-300 md:h-8 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => openFilter(true)}
    >
      <IoMdOptions className="h-4 w-4" />
      Filter
    </div>
  );
};

export default FilterTab;
