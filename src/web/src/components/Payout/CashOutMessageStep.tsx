import type { ReactNode } from "react";
import { CashOutMessage, type CashOutMessageTone } from "./CashOutMessage";

/**
 * A whole screen built around one message: `CashOutMessage` for the badge, heading and body, then
 * whatever the screen needs to show, then a primary action over a quiet one.
 *
 * The hand-off, the failures and the eight result states all use this. The gate and the
 * active-payout panel need their own arrangement below the message — a field list, a summary of
 * what is in flight — so they compose `CashOutMessage` directly rather than going through here.
 */

export const CashOutMessageStep: React.FC<{
  icon: ReactNode;
  tone?: CashOutMessageTone;
  title: string;
  body: string;
  /** the action that moves the youth on; omitted when there is nothing to do */
  primary?: { label: string; icon?: ReactNode; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  /** an inline problem with the primary action — the retry sits underneath it */
  error?: string;
  children?: ReactNode;
}> = ({
  icon,
  tone = "neutral",
  title,
  body,
  primary,
  secondary,
  error,
  children,
}) => (
  /*
    On a phone the dialog is full-screen, and this content used to stack from the top and stop
    half-way down — leaving the primary action in the middle of the screen rather than at the end of
    the thumb's reach (design review 2026-09-14). `grow` on the message block centres it in whatever
    space there is, and `mt-auto` pins the actions to the bottom. On desktop the dialog hugs its
    content, so there is no spare space and neither has any effect. The DOM order is unchanged, so
    nothing moves for a screen reader.
  */
  <div className="flex grow flex-col items-center gap-4 text-center">
    <CashOutMessage
      icon={icon}
      tone={tone}
      title={title}
      body={body}
      className="grow justify-center"
    />

    {children}

    {error && (
      <p
        role="alert"
        className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
      >
        {error}
      </p>
    )}

    <div className="mt-auto flex w-full flex-col items-center gap-2 pt-2">
      {primary && (
        <button
          type="button"
          onClick={primary.onClick}
          className="btn bg-purple hover:bg-purple w-full rounded-full text-white normal-case hover:text-white"
        >
          {primary.icon}
          {primary.label}
        </button>
      )}

      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="btn border-gray text-gray-dark hover:bg-gray-light w-full rounded-full border bg-white normal-case"
        >
          {secondary.label}
        </button>
      )}
    </div>
  </div>
);
