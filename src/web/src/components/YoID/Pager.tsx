// ─────────────────────────────────────────────────────────────────────────────
// Pager (YOM-1283)
//
// Discovery's "Previous · Page N of M · Next" pills (DiscoveryResults) for the
// Yo-ID sub-pages. `pages` is undefined where the API has no total (the wallet):
// the label is then "Page N" and `hasNext` decides whether Next is enabled.
// Renders nothing when there is only one page.
// ─────────────────────────────────────────────────────────────────────────────

const BUTTON_CLASS =
  "btn btn-sm border-gray rounded-full bg-white text-xs disabled:opacity-40";

export const Pager: React.FC<{
  page: number;
  pages?: number;
  /** whether a next page exists when `pages` is unknown; ignored otherwise */
  hasNext?: boolean;
  onChange: (page: number) => void;
}> = ({ page, pages, hasNext = false, onChange }) => {
  const nextDisabled = pages === undefined ? !hasNext : page >= pages;

  if (pages !== undefined ? pages <= 1 : page <= 1 && !hasNext) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={BUTTON_CLASS}
      >
        Previous
      </button>
      <span className="text-gray-dark text-xs">
        Page {page}
        {pages !== undefined && <> of {pages}</>}
      </span>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => onChange(page + 1)}
        className={BUTTON_CLASS}
      >
        Next
      </button>
    </div>
  );
};
