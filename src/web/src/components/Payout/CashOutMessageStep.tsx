import type { ReactNode } from "react";

/**
 * The one-message shape the boards use for the hand-off, the failures and the result: a tinted
 * circular icon, a title, a line of body copy, then a primary action over a quiet one.
 *
 * One primitive rather than three near-identical components, because these three screens are read
 * in sequence by the same youth and any drift between them shows up as the product changing shape
 * mid-flow.
 *
 * `tone` decides the icon's colour only. **None of these screens is styled as an error**, including
 * the failures: a payout Yoma could not start is Yoma's problem, nothing has left the wallet, and
 * red would tell the youth they did something wrong.
 */

const TONES = {
  neutral: "bg-purple-tint text-purple",
  info: "bg-blue-light text-blue-dark",
  warning: "bg-orange-light text-orange",
  /** reserved for a *confirmed* completed payout — never for "we sent you off to finish it" */
  success: "bg-green-light text-green",
} as const;

export const CashOutMessageStep: React.FC<{
  icon: ReactNode;
  tone?: keyof typeof TONES;
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
  <div className="flex flex-col items-center gap-4 text-center">
    <span
      className={`flex h-14 w-14 items-center justify-center rounded-full ${TONES[tone]}`}
      aria-hidden="true"
    >
      {icon}
    </span>

    <h5 className="text-black">{title}</h5>
    <p className="text-gray-dark text-sm leading-6">{body}</p>

    {children}

    {error && (
      <p
        role="alert"
        className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
      >
        {error}
      </p>
    )}

    <div className="flex w-full flex-col items-center gap-2">
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
          className="btn btn-ghost text-gray-dark rounded-full normal-case"
        >
          {secondary.label}
        </button>
      )}
    </div>
  </div>
);
