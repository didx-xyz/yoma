import React, { useState } from "react";
import { IoCheckmarkOutline, IoLinkOutline } from "react-icons/io5";

/**
 * Share this search. The URL is already the entire filter state, so a shareable search is one
 * button and no new state — copy the address bar. Confirmation is inline (not a toast): the
 * action is small, and the label saying "Copied" beside the pointer is the whole feedback.
 *
 * `navigator.clipboard` needs a secure context; where it is missing the button stays quiet and
 * does nothing rather than throwing (the address bar is still there to copy from).
 */
export const CopyLinkButton: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copy = (): void => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      title="Copy a link to this search"
      className="border-gray text-gray-dark flex min-h-9 shrink-0 items-center gap-1 rounded-full border bg-white px-3 text-xs"
    >
      {copied ? (
        <IoCheckmarkOutline className="text-green h-4 w-4" />
      ) : (
        <IoLinkOutline className="h-4 w-4" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
};
