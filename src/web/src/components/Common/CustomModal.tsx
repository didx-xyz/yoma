import React, { useEffect, useRef, type FC } from "react";
import { createPortal } from "react-dom";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

interface CustomModalProps {
  isOpen: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  shouldCloseOnOverlayClick?: boolean;
  className?: string;
}

const CustomModal: FC<CustomModalProps> = ({
  isOpen,
  onRequestClose,
  children,
  shouldCloseOnOverlayClick = false,
  className = "md:max-h-[700px] md:w-[500px]",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (shouldCloseOnOverlayClick && onRequestClose) {
      onRequestClose();
    }
  };

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
            className={`visible fixed bottom-0 left-0 right-0 top-0 flex-grow scale-95 overflow-hidden overflow-y-auto bg-white transition-all duration-300 ease-in-out ${
              isOpen ? "motion-safe:animate-enter" : "motion-safe:animate-exit"
            } md:m-auto md:rounded-3xl ${className}`}
          >
            {children}
          </div>
        </div>,
        document.body,
        "modal",
      )}
    </>
  );
};

export default CustomModal;
