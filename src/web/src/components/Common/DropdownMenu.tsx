import Link from "next/link";
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";

export interface DropdownMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export enum DropdownMenuDisplayStyle {
  DEFAULT = "default",
  BUTTON = "button",
  ICON = "icon",
}

interface DropdownMenuProps {
  label: string;
  items: DropdownMenuItem[];
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  displayStyle?: DropdownMenuDisplayStyle;
  menuClassName?: string;
  title?: string;
  triggerIcon?: ReactNode;
}

export function DropdownMenu({
  label,
  items,
  buttonClassName,
  className,
  disabled = false,
  displayStyle = DropdownMenuDisplayStyle.DEFAULT,
  menuClassName,
  title,
  triggerIcon,
}: DropdownMenuProps) {
  const popoverId = useId().replace(/:/g, "");
  const anchorName = `--dropdown-anchor-${popoverId}`;
  const menuRef = useRef<HTMLUListElement>(null);

  const anchorStyle = {
    anchorName,
  } as CSSProperties;

  const popoverStyle = {
    positionAnchor: anchorName,
    top: "calc(anchor(bottom) + 0.5rem)",
    right: "anchor(right)",
    left: "auto",
    margin: 0,
  } as CSSProperties;

  const closeMenu = () => {
    menuRef.current?.hidePopover();
  };

  const triggerClassName =
    displayStyle === DropdownMenuDisplayStyle.ICON
      ? `flex cursor-pointer items-center justify-center p-0 ${buttonClassName ?? ""}`.trim()
      : displayStyle === DropdownMenuDisplayStyle.BUTTON
        ? `bg-theme hover:bg-theme disabled:bg-gray-dark flex w-40 flex-row items-center justify-center rounded-full p-1 text-xs whitespace-nowrap text-white brightness-105 hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed ${buttonClassName ?? ""}`.trim()
        : `btn btn-sm border-green bg-green hover:text-green px-4 flex-nowrap rounded-full text-white hover:bg-white ${buttonClassName ?? ""}`.trim();

  return (
    <div className={className}>
      <button
        type="button"
        popoverTarget={popoverId}
        style={anchorStyle}
        className={triggerClassName}
        disabled={disabled}
        title={title}
      >
        {triggerIcon}
        {displayStyle !== DropdownMenuDisplayStyle.ICON && <span>{label}</span>}
        {displayStyle === DropdownMenuDisplayStyle.DEFAULT && (
          <FaChevronDown className="h-3 w-3" />
        )}
      </button>

      <ul
        ref={menuRef}
        popover="auto"
        id={popoverId}
        style={popoverStyle}
        className={`dropdown menu bg-base-100 rounded-box border-base-200 z-1 w-56 border p-2 shadow-lg ${menuClassName ?? ""}`.trim()}
      >
        {items.map((item) => (
          <li key={item.label}>
            {item.href && !item.disabled ? (
              <Link
                href={item.href}
                id={item.id}
                onClick={closeMenu}
                className="text-base-content hover:bg-base-200 flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors"
              >
                {item.icon && (
                  <span className="text-green flex h-5 w-5 items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            ) : item.onClick ? (
              <button
                type="button"
                id={item.id}
                onClick={() => {
                  item.onClick?.();
                  closeMenu();
                }}
                disabled={item.disabled}
                className="text-base-content hover:bg-base-200 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.icon && (
                  <span className="text-green flex h-5 w-5 items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium opacity-60">
                {item.icon && (
                  <span className="text-green flex h-5 w-5 items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DropdownMenu;
