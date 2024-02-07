import { atom } from "jotai";
import type { UserProfile } from "~/api/models/user";
import { atomWithStorage } from "jotai/utils";

// user profile atom
//const userProfileAtom = atom<UserProfile | null>(null);
const userProfileAtom = atomWithStorage<UserProfile | null>(
  "userProfile",
  null,
);

// small display state used by search results (show/hide filter)
const smallDisplayAtom = atom(true);

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

export {
  userProfileAtom,
  smallDisplayAtom,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  currentOrganisationLogoAtom,
  currentOrganisationInactiveAtom,
  currentLanguageAtom,
};
