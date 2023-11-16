import { atom } from "jotai";
import type { UserProfile } from "~/api/models/user";

// used to change navbar color per page (updated in global.tsx)
// default to white to avoid flickering on initial page load
const navbarColorAtom = atom("bg-white");

// user profile atom
const userProfileAtom = atom<UserProfile | null>(null);

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

export {
  navbarColorAtom,
  userProfileAtom,
  smallDisplayAtom,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  currentOrganisationLogoAtom,
};
