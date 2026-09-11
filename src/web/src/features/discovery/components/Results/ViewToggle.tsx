import React from "react";
import { IoGridOutline, IoListOutline } from "react-icons/io5";
import type { DiscoveryViewMode } from "../../lib/types";

/** Grid ↔ list. A rendering preference — switching issues no request and changes no count. */
export const ViewToggle: React.FC<{
  view: DiscoveryViewMode;
  onChange: (view: DiscoveryViewMode) => void;
}> = ({ view, onChange }) => (
  <div className="border-gray flex items-center rounded-full border bg-white p-0.5">
    {(
      [
        { id: "grid", label: "Grid", Icon: IoGridOutline },
        { id: "list", label: "List", Icon: IoListOutline },
      ] as const
    ).map(({ id, label, Icon }) => (
      <button
        key={id}
        type="button"
        aria-pressed={view === id}
        aria-label={`${label} view`}
        onClick={() => onChange(id)}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${
          view === id ? "bg-purple font-semibold text-white" : "text-gray-dark"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    ))}
  </div>
);
