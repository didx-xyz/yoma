import React, { useEffect, useState } from "react";
import { IoOptionsOutline } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Floating "Filters" entry point once the hero (and its own Filters button) has scrolled away —
 * the discovery counterpart of the old page's `FilterTab`, restyled to match the segmented bar's
 * Filters button, count badge included. Fixed at the top on both breakpoints.
 */
const SHOW_AFTER_SCROLL_Y = 300;

export const FloatingFilterButton: React.FC<{ onOpen: () => void }> = ({
  onOpen,
}) => {
  const { chips } = useDiscovery();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (): void =>
      setVisible(
        (window.scrollY || document.documentElement.scrollTop) >
          SHOW_AFTER_SCROLL_Y,
      );
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`bg-purple hover:bg-purple-shade shadow-custom fixed top-16 left-1/2 z-30 flex min-h-9 -translate-x-1/2 items-center gap-1.5 rounded-b-xl px-4 text-sm font-semibold text-white transition-opacity duration-300 select-none motion-reduce:transition-none md:top-20 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <IoOptionsOutline className="h-4 w-4" />
      Filters
      {chips.length > 0 && (
        <span className="text-purple flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs">
          {chips.length}
        </span>
      )}
    </button>
  );
};
