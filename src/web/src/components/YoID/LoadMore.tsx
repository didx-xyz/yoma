import React from "react";
import { Message } from "~/features/discovery/components/shared/Message";
import { formatNumber } from "~/features/discovery/lib/format";

/**
 * The "Load more" block under an infinite list (the passport's credentials, the add page's
 * recently viewed): the button with its spinner while a page is in flight, a Retry line when the
 * last page failed, and "Showing x of y <noun>" read out as it changes. The caller renders it only
 * while there is a next page.
 */
export const LoadMore: React.FC<{
  label: string;
  /** "credentials", "viewed opportunities" — what `loaded` of `total` counts. */
  noun: string;
  loaded: number;
  total: number;
  loading: boolean;
  /** The last page failed (`isFetchNextPageError`): Retry shows while nothing is in flight. */
  failed: boolean;
  onLoadMore: () => void;
  className?: string;
}> = ({
  label,
  noun,
  loaded,
  total,
  loading,
  failed,
  onLoadMore,
  className = "",
}) => (
  <div className={`flex flex-col items-center gap-2 ${className}`}>
    {failed && !loading && (
      <Message kind="error">
        Couldn&apos;t load more.{" "}
        <button
          type="button"
          onClick={onLoadMore}
          className="font-semibold underline"
        >
          Retry
        </button>
      </Message>
    )}
    <button
      type="button"
      onClick={onLoadMore}
      disabled={loading}
      aria-busy={loading}
      className="btn border-green text-green hover:bg-green-light min-h-12 min-w-56 rounded-full bg-white px-6 text-base font-semibold"
    >
      {loading ? (
        <>
          <span aria-hidden className="loading loading-spinner loading-sm" />
          Loading…
        </>
      ) : (
        label
      )}
    </button>
    <p aria-live="polite" className="text-gray-dark text-xs">
      Showing {formatNumber(loaded)} of {formatNumber(total)} {noun}
    </p>
  </div>
);
