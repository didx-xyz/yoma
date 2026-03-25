import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { UserProfile } from "~/api/models/user";

const removeOnNullStorage = <T,>() => {
  return {
    getItem: (key: string, initialValue: T) => {
      if (typeof window === "undefined") return initialValue;

      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;

      try {
        return JSON.parse(raw) as T;
      } catch {
        return initialValue;
      }
    },
    setItem: (key: string, value: T) => {
      if (typeof window === "undefined") return;

      if (value === (null as unknown as T)) {
        window.localStorage.removeItem(key);
        return;
      }

      window.localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
    },
  };
};

// user profile atom
const userProfileAtom = atom<UserProfile | null>(null);

// tracks the current screen width for mobile detection
const screenWidthAtom = atom(0);

// PROFILE SWITCHING:
// these atoms are used to override the navbar links (based on path & role) and user image/company logo
// (updated in global.tsx, used in navbar.tsx & usermnenu.tsx)
export enum RoleView {
  User,
  Admin,
  OrgAdmin,
}
const activeNavigationRoleViewAtom = atom<RoleView>(RoleView.User);
const currentOrganisationIdAtom = atom<string | null>(null);
const currentOrganisationLogoAtom = atom<string | null>(null);
// this atom is used to check if the organisation is active or not
// and show "limited functionality" message on organisation pages
const currentOrganisationInactiveAtom = atom(false);

// atom for the current language
const currentLanguageAtom = atom<string>("en");

// user country selection atom
// the user selects this if no country on the user profile (marketplace)
// persisted across browser sessions
const userCountrySelectionAtom = atomWithStorage<string | null>(
  "userCountrySelection",
  null,
);

// RUM consent (unauthenticated users)
// persisted across browser sessions until migrated to DB on login
const rumConsentAtom = atomWithStorage<boolean | null>(
  "rumConsent",
  null,
  removeOnNullStorage<boolean | null>(),
);

// first actionable referee referral target URL (used by navbar/toasts to route
// users either back into claim onboarding or onward to progress)
const firstActionableRefereeReferralUrlAtom = atom<string | null>(null);

// tracks if pending-referral toast has already been shown in the current login lifecycle
const hasShownRefereePendingToastAtom = atomWithStorage<boolean>(
  "hasShownRefereePendingToast",
  false,
  undefined,
  { getOnInit: true },
);

// tracks whether referee welcome modal was dismissed for current browser login session
const hasDismissedRefereeWelcomeModalAtom = atomWithStorage<boolean>(
  "hasDismissedRefereeWelcomeModal",
  false,
  undefined,
  { getOnInit: true },
);

export {
  userProfileAtom,
  screenWidthAtom,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  currentOrganisationLogoAtom,
  currentOrganisationInactiveAtom,
  currentLanguageAtom,
  userCountrySelectionAtom,
  rumConsentAtom,
  firstActionableRefereeReferralUrlAtom,
  hasShownRefereePendingToastAtom,
  hasDismissedRefereeWelcomeModalAtom,
};
