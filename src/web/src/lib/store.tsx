import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { UserProfile } from "~/api/models/user";

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

// referee progress dialog visibility atom
const refereeProgressDialogVisibleAtom = atom(false);

// referee progress dialog dismissed state
// persisted across browser sessions
const refereeProgressDialogDismissedAtom = atomWithStorage<boolean>(
  "refereeProgressDialogDismissed",
  false,
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
  refereeProgressDialogVisibleAtom,
  refereeProgressDialogDismissedAtom,
};
