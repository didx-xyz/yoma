import type { ReactNode } from "react";

/**
 * The shape every Cash Out screen says something in: a round tinted icon, a heading, and a line of
 * body copy.
 *
 * It started as the result screens' layout and is now the single one, because the gate, the
 * active-payout panel and the outcomes are all the same act — telling a youth where their money
 * stands — and were being drawn three different ways: a small icon beside a left-aligned heading,
 * a tinted panel with a bold first line, and this. The design review's point about the added
 * outcome states looking bolted on was the same observation from the other end.
 *
 * `tone` colours the badge and nothing else. **None of these screens is an error**, including the
 * failures: a cash out Yoma could not start is Yoma's problem, the Zlto comes back, and red would
 * tell the youth they did something wrong. `success` is reserved for a *confirmed* completed
 * payout — never for "we sent you off to finish it".
 */

export type CashOutMessageTone = "neutral" | "info" | "warning" | "success";

const TONES: Record<CashOutMessageTone, string> = {
  neutral: "bg-purple-tint text-purple",
  info: "bg-blue-light text-blue-dark",
  warning: "bg-orange-light text-orange",
  success: "bg-green-light text-green",
};

export const CashOutMessage: React.FC<{
  icon: ReactNode;
  tone?: CashOutMessageTone;
  /** optional: a notice that is its own screen may have nothing to head it */
  title?: string;
  body: string;
  /**
   * Part of the message rather than something below it — for a body that does not finish on its
   * own, like the gate's "…needs these details before you can cash out:" and the list that
   * completes it.
   *
   * ⚠️ **Why it belongs in here and not in the caller.** Screens that centre this block pass
   * `grow justify-center`, which centres *the block* and pushes every later sibling to the bottom
   * of the dialog. A continuation left outside therefore lands next to the buttons, half a screen
   * from the sentence it finishes. Anything that is genuinely a separate section — a summary of
   * figures, an alert — stays outside and should.
   */
  children?: ReactNode;
  className?: string;
}> = ({ icon, tone = "neutral", title, body, children, className = "" }) => (
  <div className={`flex flex-col items-center gap-4 text-center ${className}`}>
    <span
      className={`flex h-14 w-14 items-center justify-center rounded-full ${TONES[tone]}`}
      aria-hidden="true"
    >
      {icon}
    </span>

    {/* 22px against a 15px body: on a phone the title was rendering at roughly body size, so the
        screen had no clear first thing to read (design review 2026-09-14). */}
    {title && (
      <h5 className="font-family-nunito text-[22px] leading-tight font-bold text-black">
        {title}
      </h5>
    )}
    <p className="text-gray-dark text-[15px] leading-6">{body}</p>

    {/* Tighter than the block's own rhythm: this finishes the sentence above it. */}
    {children && <div className="-mt-2">{children}</div>}
  </div>
);
