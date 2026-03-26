import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

interface ReferralTapCardProps {
  href?: string;
  onClick?: () => void;
  openInNewTab?: boolean;
  className: string;
  children: ReactNode;
}

const TAP_MOVEMENT_THRESHOLD_PX = 10;

// Keeps carousel cards tappable on touch devices by treating short taps as navigation
// while letting horizontal drag gestures pass through to the slider.
export const ReferralTapCard = ({
  href,
  onClick,
  openInNewTab = false,
  className,
  children,
}: ReferralTapCardProps) => {
  const router = useRouter();
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const resetPointerState = useCallback(() => {
    pointerStartRef.current = null;
  }, []);

  const activate = useCallback(() => {
    if (href) {
      if (openInNewTab) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      void router.push(href);
      return;
    }

    onClick?.();
  }, [href, onClick, openInNewTab, router]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") return;

    suppressClickRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch" || !pointerStartRef.current) return;

      const distanceX = Math.abs(event.clientX - pointerStartRef.current.x);
      const distanceY = Math.abs(event.clientY - pointerStartRef.current.y);

      if (
        distanceX > TAP_MOVEMENT_THRESHOLD_PX ||
        distanceY > TAP_MOVEMENT_THRESHOLD_PX
      ) {
        resetPointerState();
      }
    },
    [resetPointerState],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch" || !pointerStartRef.current) return;

      suppressClickRef.current = true;
      resetPointerState();
      activate();
    },
    [activate, resetPointerState],
  );

  const handlePointerCancel = useCallback(() => {
    resetPointerState();
  }, [resetPointerState]);

  const handleLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!suppressClickRef.current) return;

      event.preventDefault();
      suppressClickRef.current = false;
    },
    [],
  );

  if (href) {
    return (
      <Link
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={className}
        onClick={handleLinkClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={className}
    >
      {children}
    </button>
  );
};
