import Link from "next/link";
import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";

export interface DropdownMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
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
  /**
   * Text colour for the menu item icons and for the icon-style trigger (whose icon
   * inherits it). Defaults to the page theme — blue on admin pages, green on org-admin
   * pages — which matches the themed trigger button.
   */
  colorClassName?: string;
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
  colorClassName = "text-theme",
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

  // layout only — colour comes from the parent via buttonClassName (admin pages are
  // blue, org-admin pages green), typically by passing the theme-driven `bg-theme`.
  const TRIGGER_LAYOUT: Record<DropdownMenuDisplayStyle, string> = {
    [DropdownMenuDisplayStyle.ICON]:
      "flex cursor-pointer items-center justify-center p-0",
    [DropdownMenuDisplayStyle.BUTTON]:
      "flex w-40 flex-row items-center justify-center rounded-full p-1 text-xs whitespace-nowrap hover:cursor-pointer",
    [DropdownMenuDisplayStyle.DEFAULT]:
      "btn btn-sm flex-nowrap rounded-full px-4",
  };

  // icon-style triggers have no fill, so they take the accent colour (the icon inherits
  // it); filled/outline triggers are coloured by the parent via buttonClassName.
  const triggerColor =
    displayStyle === DropdownMenuDisplayStyle.ICON ? colorClassName : "";

  const triggerClassName =
    `${TRIGGER_LAYOUT[displayStyle]} ${triggerColor} disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName ?? ""}`.trim();

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
        className={`menu dropdown rounded-box border-base-200 bg-base-100 z-1 w-56 border p-2 shadow-lg ${menuClassName ?? ""}`.trim()}
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
                  <span
                    className={`${colorClassName} flex h-5 w-5 items-center justify-center`}
                  >
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
                title={item.disabled ? item.disabledTooltip : undefined}
                className="text-base-content hover:bg-base-200 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.icon && (
                  <span
                    className={`${colorClassName} flex h-5 w-5 items-center justify-center`}
                  >
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            ) : (
              <span
                title={item.disabledTooltip}
                className="text-base-content flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-xs opacity-50"
              >
                {item.icon && (
                  <span
                    className={`${colorClassName} flex h-5 w-5 items-center justify-center`}
                  >
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
