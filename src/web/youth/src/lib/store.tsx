import { atom } from "jotai";
import type { UserProfile } from "~/api/models/user";

// used to change navbar color per page
// default to white to avoid flickering on initial page load
const navbarColorAtom = atom("bg-white");

// user profile atom
const userProfileAtom = atom<UserProfile | null>(null);

export { navbarColorAtom, userProfileAtom };
