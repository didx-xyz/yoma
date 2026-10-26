import type { UserPreferences } from "~/api/models/userPreferences";
import { PREFERENCE_STEPS } from "../registry/preferenceSteps";

/**
 * The wizard → profile → wizard round trip (Jason, 2026-10-22). "Change in your profile" leaves
 * the discovery page for `/user/profile`; Cancel and Save there must land back IN THE WIZARD, on
 * the step the youth left, with the answers they had not saved yet.
 *
 * Three pieces make that deterministic:
 * - `?personalize=<step id>` on the discovery URL opens the wizard on that step (the user menu's
 *   `personalize=1` keeps meaning "open as usual"). `personalizeStepIndex` reads it.
 * - The profile page is given that URL as `returnUrl` (`profileHrefFrom`), so neither button
 *   depends on history — `router.back()` from a fresh tab had nowhere to go, and from a
 *   client-side visit it landed on the wizard's own history sentinel instead of the page.
 * - The draft is stashed in the session on the way out and taken back on the way in
 *   (`stashWizardDraft` / `takeWizardDraft`): the dialog seeds from the SAVED preferences at
 *   mount, which would drop every answer the youth had typed since.
 */
const DRAFT_KEY = "yoma.discovery.wizardDraft";

/** The 0-based step `?personalize=` names, or `null` for "open as usual" (`1`, anything else). */
export const personalizeStepIndex = (param: unknown): number | null => {
  if (typeof param !== "string") return null;
  const index = PREFERENCE_STEPS.findIndex((step) => step.id === param);
  return index === -1 ? null : index;
};

/**
 * `/user/profile?returnUrl=…` — the return URL is the discovery page as it is now (filters and
 * all) with `personalize=<step id>` set, so the wizard reopens on `stepId` once back.
 */
export const profileHrefFrom = (asPath: string, stepId: string): string => {
  const url = new URL(asPath, "https://relative.local");
  url.searchParams.set("personalize", stepId);
  return `/user/profile?returnUrl=${encodeURIComponent(url.pathname + url.search)}`;
};

/** The step a block with this preference key lives on — the round trip names it in the URL. */
export const stepIdOfPreference = (prefKey: string): string =>
  PREFERENCE_STEPS.find((step) =>
    step.blocks.some((block) => block.prefKey === prefKey),
  )?.id ?? PREFERENCE_STEPS[0]!.id;

export function stashWizardDraft(draft: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked: the step still restores, the draft reseeds from what was saved.
  }
}

/** Reads AND clears the stash, so a trip never seeds a later, unrelated opening. */
export function takeWizardDraft(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    window.sessionStorage.removeItem(DRAFT_KEY);
    return raw === null ? null : (JSON.parse(raw) as UserPreferences);
  } catch {
    return null;
  }
}
