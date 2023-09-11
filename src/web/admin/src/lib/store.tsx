import { atom } from "jotai";

// used to change navbar color per page
// default to white to avoid flickering on initial page load
const navbarColorAtom = atom("bg-white");

export { navbarColorAtom };
