import React from "react";
import type { IconType } from "react-icons";
import {
  IoAlertCircleOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
} from "react-icons/io5";

/**
 * Small inline message — one look for informational, warning and error notes across the
 * discovery surface (wizard info notes, pending-API notes, the mock banner, the list-view
 * explainer). Icon + tinted panel; content stays plain text.
 */
const KINDS: Record<
  "info" | "warning" | "error",
  { icon: IconType; className: string }
> = {
  info: {
    icon: IoInformationCircleOutline,
    className: "bg-gray-light text-gray-dark",
  },
  warning: { icon: IoWarningOutline, className: "bg-yellow-tint text-yellow" },
  error: { icon: IoAlertCircleOutline, className: "bg-pink/10 text-pink" },
};

export const Message: React.FC<{
  kind?: "info" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}> = ({ kind = "info", children, className = "" }) => {
  const { icon: Icon, className: kindClassName } = KINDS[kind];
  return (
    <p
      className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${kindClassName} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
};
