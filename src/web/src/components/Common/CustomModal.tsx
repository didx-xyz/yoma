import React, { useEffect, useRef, type FC, useState } from "react";
import { createPortal } from "react-dom";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

type AnimationStyle =
  | "fade"
  | "slide-bottom"
  | "slide-top"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "spin";

interface CustomModalProps {
  isOpen: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  shouldCloseOnOverlayClick?: boolean;
  className?: string;
  animationStyle?: AnimationStyle; // New prop for animation style
}

const CustomModal: FC<CustomModalProps> = ({
  isOpen,
  onRequestClose,
  children,
  shouldCloseOnOverlayClick = false,
  className = "md:max-h-[700px] md:w-[500px]",
  animationStyle = "scale", // Default animation style
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [modalContainer, setModalContainer] = useState<HTMLElement | null>(
    null,
  );

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isOpen);

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
    // Create modal container on client side
    const div = document.createElement("div");
    div.setAttribute("id", "modal-root"); // Ensure you have a modal-root in your public/index.html
    document.body.appendChild(div);
    setModalContainer(div);

    return () => {
      // Clean up the modal container on unmount
      document.body.removeChild(div);
    };
  }, []);

  if (!isOpen || !modalContainer) return null;

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
      case "scale":
      default:
        animationClasses = "motion-safe:animate-exit";
        break;
    }
  }

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-overlay"
            onClick={handleOverlayClick}
          />
          <div
            ref={modalRef}
            tabIndex={-1}
            className={`visible fixed bottom-0 left-0 right-0 top-0 flex-grow scale-95 overflow-hidden overflow-y-auto bg-white transition-all duration-300 ease-in-out ${animationClasses} md:m-auto md:rounded-3xl ${className}`}
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
