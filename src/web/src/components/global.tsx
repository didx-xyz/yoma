import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getOrganisationById } from "~/api/services/organisations";
import { getUserProfile } from "~/api/services/user";
import {
  currentOrganisationIdAtom,
  currentOrganisationLogoAtom,
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

  // track the screen size for responsive elements
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
  // set currentOrganisationId atom on route change
  const router = useRouter();
  const setNavbarColor = useSetAtom(navbarColorAtom);
  const currentOrganisationIdValue = useAtomValue(currentOrganisationIdAtom);
  const setCurrentOrganisationIdAtom = useSetAtom(currentOrganisationIdAtom);
  const setCurrentOrganisationLogoAtom = useSetAtom(
    currentOrganisationLogoAtom,
  );

  useEffect(() => {
    // logic to perform "profile-switching"
    // if organisation page, OrgAdmins sees green. navbar links & company logo changes
    if (router.asPath.startsWith("/organisations")) {
      const matches = router.asPath.match(/\/organisations\/([a-z0-9-]{36})/);

      setNavbarColor("bg-green");

      if (matches && matches.length > 1) {
        const orgId = matches[1];
        if (!orgId) return;

        if (orgId != currentOrganisationIdValue) {
          // update atom (change navbar links)
          setCurrentOrganisationIdAtom(orgId);

          // get the organisation logo, update atom (change user image to company logo)
          getOrganisationById(orgId).then((res) => {
            if (res.logoURL) setCurrentOrganisationLogoAtom(res.logoURL);
            else setCurrentOrganisationLogoAtom(null);
          });
        }

        return;
      }
    } else {
      setCurrentOrganisationIdAtom(null);
      setCurrentOrganisationLogoAtom(null);

      // admins sees blue
      if (router.asPath.startsWith("/admin")) setNavbarColor("bg-blue");
      // everyone else sees purple (public youth)
      else setNavbarColor("bg-purple");
    }
  }, [
    router,
    setNavbarColor,
    setCurrentOrganisationIdAtom,
    setCurrentOrganisationLogoAtom,
    currentOrganisationIdValue,
  ]);

  return null;
};
