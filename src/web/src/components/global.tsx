import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getUserProfile } from "~/api/services/user";
import {
  navbarColorAtom,
  smallDisplayAtom,
  userProfileAtom,
} from "~/lib/store";

// * global app concerns
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  // 🔔 USER PROFILE ATOM
  const { data: session } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);

  useEffect(() => {
    if (session && !userProfile) {
      getUserProfile()
        .then((res) => {
          setUserProfile(res);
        })
        .catch((e) => console.error(e));
    }
  }, [session, userProfile, setUserProfile]);

  // 🔔 SMALL DISPLAY ATOM
  const setSmallDisplay = useSetAtom(smallDisplayAtom);

  // 🔔 track the screen size for responsive elements
  useEffect(() => {
    function onResize() {
      const small = window.innerWidth < 768;
      setSmallDisplay(small);
    }
    onResize();
    window.addEventListener("resize", onResize);

    // 👇️ remove the event listener when component unmounts
    return () => window.removeEventListener("resize", onResize);
  }, [setSmallDisplay]);

  // 🔔 ROUTE CHANGE HANDLER
  // set navbarColor atom on route change
  // used to change navbar color per page
  const router = useRouter();
  const setNavbarColor = useSetAtom(navbarColorAtom);

  useEffect(() => {
    if (
      router.asPath.startsWith("/dashboard/opportunities") ||
      router.asPath.startsWith("/dashboard/opportunity")
    )
      setNavbarColor("bg-blue");
    else if (
      router.asPath.match(/\/organisations\/[a-z0-9-]{36}\/opportunities/)
    )
      setNavbarColor("bg-green");
    else if (
      router.asPath.startsWith("/user") ||
      router.asPath.startsWith("/organisation")
    )
      setNavbarColor("bg-blue-dark");
    else setNavbarColor("bg-purple");
  }, [router, setNavbarColor]);

  return null;
};
