import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getOrganisationById } from "~/api/services/organisations";
import { getUserProfile } from "~/api/services/user";
import { ROLE_ADMIN, ROLE_ORG_ADMIN } from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  currentOrganisationLogoAtom,
  smallDisplayAtom,
  userProfileAtom,
} from "~/lib/store";

// * GLOBAL APP CONCERNS
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const setActiveNavigationRoleViewAtom = useSetAtom(
    activeNavigationRoleViewAtom,
  );
  const currentOrganisationIdValue = useAtomValue(currentOrganisationIdAtom);
  const setCurrentOrganisationIdAtom = useSetAtom(currentOrganisationIdAtom);
  const setCurrentOrganisationLogoAtom = useSetAtom(
    currentOrganisationLogoAtom,
  );
  const setSmallDisplay = useSetAtom(smallDisplayAtom);

  // 🔔 USER PROFILE
  useEffect(() => {
    if (!userProfile) {
      getUserProfile()
        .then((res) => {
          setUserProfile(res);
        })
        .catch((e) => console.error(e));
    }
  }, [router, session, userProfile, setUserProfile]);

  // 🔔 SMALL DISPLAY
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
  useEffect(() => {
    if (!session) {
      setActiveNavigationRoleViewAtom(RoleView.User);
      return;
    }

    // set the active role view atom (based on roles)
    const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);
    const isOrgAdmin = session?.user?.roles.includes(ROLE_ORG_ADMIN);

    if (
      isAdmin &&
      (router.asPath.startsWith("/admin") ||
        router.asPath.startsWith("/organisations"))
    ) {
      setActiveNavigationRoleViewAtom(RoleView.Admin);
    } else if (isOrgAdmin && router.asPath.startsWith("/organisations")) {
      setActiveNavigationRoleViewAtom(RoleView.OrgAdmin);
    } else {
      setActiveNavigationRoleViewAtom(RoleView.User);
    }

    //  if organisation page, change navbar links & company logo
    if (router.asPath.startsWith("/organisations")) {
      const matches = router.asPath.match(/\/organisations\/([a-z0-9-]{36})/);

      if (matches && matches.length > 1) {
        const orgId = matches[1];
        if (!orgId) return;

        if (orgId != currentOrganisationIdValue) {
          // update atom (navbar items)
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
    }
  }, [
    router,
    session,
    setCurrentOrganisationIdAtom,
    setCurrentOrganisationLogoAtom,
    setActiveNavigationRoleViewAtom,
    currentOrganisationIdValue,
  ]);

  return null;
};
