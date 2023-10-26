import { atom } from "jotai";
import type { UserProfile } from "~/api/models/user";

// used to change navbar color per page
// default to white to avoid flickering on initial page load
const navbarColorAtom = atom("bg-white");

// user profile atom
const userProfileAtom = atom<UserProfile | null>(null);

// small display state used by search results (show/hide filter)
const smallDisplayAtom = atom(true);

export { navbarColorAtom, userProfileAtom, smallDisplayAtom };
