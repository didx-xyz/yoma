import type { FormEventHandler, ReactNode } from "react";
import { IoMdClose } from "react-icons/io";
import {
  BTN_DIALOG_CLOSE,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "~/components/Common/buttonStyles";

/**
 * Shell for the filter popup shared by the admin list pages: a "Filters" header with a
 * dismiss button, one or two accordions of labelled fields, and Close / Apply.
 *
 * Filters live only in this dialog — there is no inline filter row and no Clear button
 * here; clearing is done from the applied-filter badges.
 */

// compact controls — the dialog is narrow. Matches the react-select control styling used by
// CustomFieldFilters so every section of every dialog looks the same.
export const SELECT_CONTROL_CLASSES =
  "input w-full !border-gray pr-0 pl-2 h-fit py-1 text-sm";
export const DATE_INPUT_CLASSES =
  "input input-sm border-gray focus:border-gray h-10 min-h-10 w-full rounded-md text-sm focus:outline-none";

/** One labelled filter row. */
export const FilterField: React.FC<{
  label: string;
  error?: string;
  children: ReactNode;
}> = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <span className="text-gray-dark text-xs font-semibold tracking-wide uppercase">
      {label}
    </span>
    {children}
    {error && <span className="text-xs text-red-500 italic">{error}</span>}
  </div>
);

/**
 * Shared react-select props. `menuPortalTarget` keeps the menu above the dialog — pass the
 * page's reference div (the `htmlRef` every filter dialog takes).
 */
export const filterSelectProps = (htmlRef: HTMLDivElement) => ({
  classNames: { control: () => SELECT_CONTROL_CLASSES },
  isMulti: true as const,
  menuPortalTarget: htmlRef,
  styles: {
    menuPortal: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: 9999,
    }),
    placeholder: (base: Record<string, unknown>) => ({
      ...base,
      color: "#A3A6AF",
    }),
  },
});

const Accordion: React.FC<{
  title: string;
  name: string;
  defaultChecked?: boolean;
  children: ReactNode;
}> = ({ title, name, defaultChecked, children }) => (
  <div className="collapse-arrow join-item collapse">
    <input type="checkbox" name={name} defaultChecked={defaultChecked} />
    <div className="collapse-title font-semibold">{title}</div>
    <div className="collapse-content">{children}</div>
  </div>
);

export const ListPageFilterDialog: React.FC<{
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
  /** e.g. a hidden input that carries the search term through an Apply */
  hiddenInputs?: ReactNode;
  /** the "General" accordion's fields */
  children: ReactNode;
  /** the "Additional" accordion's content; omitted for domains that have none */
  additional?: ReactNode;
}> = ({ onSubmit, onCancel, hiddenInputs, children, additional }) => (
  <form onSubmit={onSubmit} className="flex flex-col">
    <div className="flex flex-row items-center px-4 py-3">
      <h1 className="my-auto grow text-lg font-bold">Filters</h1>
      <button
        type="button"
        className={BTN_DIALOG_CLOSE}
        onClick={onCancel}
        aria-label="Close"
      >
        <IoMdClose className="h-5 w-5" />
      </button>
    </div>

    {hiddenInputs}

    <div className="bg-gray-light flex flex-col">
      <div className="join join-vertical w-full">
        <Accordion title="General" name="my-accordion-general" defaultChecked>
          <div className="flex flex-col gap-3 pb-2">{children}</div>
        </Accordion>

        {additional && (
          <Accordion title="Additional" name="my-accordion-additional">
            {additional}
          </Accordion>
        )}
      </div>
    </div>

    {/* BUTTONS */}
    <div className="flex flex-row items-center justify-center gap-3 px-4 py-4">
      <button
        type="button"
        className={`${BTN_SECONDARY} w-28`}
        onClick={onCancel}
      >
        Close
      </button>
      <button type="submit" className={`${BTN_PRIMARY} w-28`}>
        Apply
      </button>
    </div>
  </form>
);

export default ListPageFilterDialog;
