import { useEffect } from "react";

/**
 * The width of a classic scrollbar, measured on a throwaway element: it holds even when something
 * else has already hidden the root's overflow (daisyUI's drawer does, through CSS, in the same
 * commit that opens it — so `innerWidth - clientWidth` reads 0 there). Overlay scrollbars
 * (phones, macOS) measure 0.
 */
const scrollbarWidth = (): number => {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
  document.body.appendChild(probe);
  const width = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return width;
};

/**
 * Locks the page's scroll while a dialog or drawer is open. Hiding the root's overflow drops a
 * classic scrollbar, and the page would widen by its width and shift under the overlay
 * (Jason, 2026-10-22), so that width goes into `--scrollbar-gap` on `<html>`: the body and the
 * fixed chrome (`.scroll-lock-pad`, see `globals.css`) keep it as right padding while locked.
 * A page too short to scroll had no scrollbar to lose, so it gets no gap.
 */
export const useDisableBodyScroll = (open: boolean) => {
  useEffect(() => {
    const root = document.documentElement;
    const lock = () => {
      const gap = root.scrollHeight > window.innerHeight ? scrollbarWidth() : 0;
      if (gap > 0) root.style.setProperty("--scrollbar-gap", `${gap}px`);
      document.body.style.overflow = "hidden";
      root.style.overflow = "hidden";
    };
    const unlock = () => {
      document.body.style.overflow = "";
      root.style.overflow = "";
      root.style.removeProperty("--scrollbar-gap");
    };

    if (open) lock();
    else unlock();

    return unlock;
  }, [open]);
};
