import React, { useEffect, useRef, type FC, useState } from "react";
import { createPortal } from "react-dom";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { nunito, openSans } from "~/lib/fonts";

type AnimationStyle =
  | "fade"
  | "slide-bottom"
  | "slide-top"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "spin"
  /** The sheet rises 8px while fading in (the completion dialogs); fades out. */
  | "rise";

interface CustomModalProps {
  isOpen: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  shouldCloseOnOverlayClick?: boolean;
  className?: string;
  animationStyle?: AnimationStyle;
}

const CustomModal: FC<CustomModalProps> = ({
  isOpen,
  onRequestClose,
  children,
  shouldCloseOnOverlayClick = false,
  className = "md:max-h-[700px] md:w-[500px]",
  animationStyle = "scale",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalContainer, setModalContainer] = useState<HTMLElement | null>(
    null,
  );

  const isBannerMode = className.includes("modal-banner");

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isOpen && !isBannerMode);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onRequestClose) {
        onRequestClose();
      }
    };

    if (isOpen && shouldCloseOnOverlayClick) {
      document.addEventListener("keydown", handleEsc);
      modalRef.current?.focus();
    }

    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onRequestClose, shouldCloseOnOverlayClick]);

  useEffect(() => {
    // Create modal container on client side. It sits on <body>, outside `#mainContent`, so it
    // carries the site fonts itself (`globals.css` names `#modal-root` beside `#mainContent`).
    const div = document.createElement("div");
    div.setAttribute("id", "modal-root");
    div.className = `${openSans.variable} ${nunito.variable} font-sans`;
    document.body.appendChild(div);
    setModalContainer(div);

    return () => {
      // Clean up the modal container on unmount
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    };
  }, []);

  // The newest open dialog paints on top: every container is `fixed z-40`, so the later one in
  // <body> wins. A dialog mounted earlier (e.g. the confirmation context's) moves to the end when
  // it opens, so it never lands under one opened after it mounted.
  useEffect(() => {
    if (isOpen && modalContainer) document.body.appendChild(modalContainer);
  }, [isOpen, modalContainer]);

  // Don't render portal content if modal is closed or container not ready
  if (!modalContainer) return null;

  const handleOverlayClick = () => {
    if (shouldCloseOnOverlayClick && onRequestClose) {
      onRequestClose();
    }
  };

  let animationClasses = "";
  if (isOpen) {
    switch (animationStyle) {
      case "fade":
        animationClasses = "motion-safe:animate-fade-in";
        break;
      case "slide-bottom":
        animationClasses = "motion-safe:animate-slide-in-bottom";
        break;
      case "slide-top":
        animationClasses = "motion-safe:animate-slide-in-top";
        break;
      case "slide-left":
        animationClasses = "motion-safe:animate-slide-in-left";
        break;
      case "slide-right":
        animationClasses = "motion-safe:animate-slide-in-right";
        break;
      case "spin":
        animationClasses = "motion-safe:animate-spin-once";
        break;
      case "rise":
        animationClasses = "motion-safe:animate-rise-in";
        break;
      case "scale":
      default:
        animationClasses = "motion-safe:animate-enter";
        break;
    }
  } else {
    switch (animationStyle) {
      case "fade":
        animationClasses = "motion-safe:animate-fade-out";
        break;
      case "slide-bottom":
        animationClasses = "motion-safe:animate-slide-out-bottom";
        break;
      case "slide-top":
        animationClasses = "motion-safe:animate-slide-out-top";
        break;
      case "slide-left":
        animationClasses = "motion-safe:animate-slide-out-left";
        break;
      case "slide-right":
        animationClasses = "motion-safe:animate-slide-out-right";
        break;
      case "spin":
        animationClasses = ""; // No exit animation for spin
        break;
      case "rise":
        animationClasses = "motion-safe:animate-fade-out";
        break;
      case "scale":
      default:
        animationClasses = "motion-safe:animate-exit";
        break;
    }
  }

  return (
    <>
      {isOpen &&
        createPortal(
          <div
            className={`fixed inset-0 z-40 ${
              isBannerMode ? "pointer-events-none" : ""
            }`}
          >
            <div
              className={`fixed inset-0 ${
                isBannerMode
                  ? "pointer-events-none bg-transparent"
                  : "bg-overlay"
              }`}
              onClick={handleOverlayClick}
            />
            <div
              ref={modalRef}
              tabIndex={-1}
              id="custom-modal-content"
              className={`visible fixed top-0 right-0 bottom-0 left-0 grow overflow-hidden overflow-y-auto bg-white transition-all duration-300 ease-in-out ${animationClasses} md:m-auto md:rounded-3xl ${
                isBannerMode ? "pointer-events-auto" : ""
              } ${className}`}
            >
              {children}
            </div>
          </div>,
          modalContainer,
        )}
    </>
  );
};

export default CustomModal;
