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
  navbarColorAtom,
  smallDisplayAtom,
  userProfileAtom,
} from "~/lib/store";

// * global app concerns
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const setactiveNavigationRoleViewAtom = useSetAtom(
    activeNavigationRoleViewAtom,
  );
  const setNavbarColor = useSetAtom(navbarColorAtom);
  const currentOrganisationIdValue = useAtomValue(currentOrganisationIdAtom);
  const setCurrentOrganisationIdAtom = useSetAtom(currentOrganisationIdAtom);
  const setCurrentOrganisationLogoAtom = useSetAtom(
    currentOrganisationLogoAtom,
  );
  const setSmallDisplay = useSetAtom(smallDisplayAtom);

  useEffect(() => {
    // // 🔔 PROFILE SWITCHING: SET DEFAULT COLOR BASED ON ROLE
    // if (!session) {
    //   setactiveNavigationRoleViewAtom(RoleView.User);
    //   setNavbarColor("bg-purple");
    //   return;
    // }

    // set the active role view atom (based on roles)
    // const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);
    // const isOrgAdmin = session?.user?.roles.includes(ROLE_ORG_ADMIN);

    // if (isAdmin) {
    //   setactiveNavigationRoleViewAtom(RoleView.Admin);
    //   setNavbarColor("bg-blue");
    // } else if (isOrgAdmin) {
    //   setactiveNavigationRoleViewAtom(RoleView.OrgAdmin);
    //   setNavbarColor("bg-green");
    // } else {
    //   setactiveNavigationRoleViewAtom(RoleView.User);
    //   setNavbarColor("bg-purple");
    // }

    // 🔔 USER PROFILE
    if (!userProfile) {
      getUserProfile()
        .then((res) => {
          setUserProfile(res);
        })
        .catch((e) => console.error(e));
    }

    // if home page then override navbar color to purple
    if (router.asPath === "/") setNavbarColor("bg-purple");
  }, [
    router,
    session,
    userProfile,
    setUserProfile,
    setactiveNavigationRoleViewAtom,
    setNavbarColor,
  ]);

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
      setactiveNavigationRoleViewAtom(RoleView.User);
      setNavbarColor("bg-purple");
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
      setactiveNavigationRoleViewAtom(RoleView.Admin);
      setNavbarColor("bg-blue");
    } else if (isOrgAdmin && router.asPath.startsWith("/organisations")) {
      setactiveNavigationRoleViewAtom(RoleView.OrgAdmin);
      setNavbarColor("bg-green");
    } else {
      setactiveNavigationRoleViewAtom(RoleView.User);
      setNavbarColor("bg-purple");
    }

    //  if organisation page, OrgAdmins sees green. navbar links & company logo changes
    if (router.asPath.startsWith("/organisations")) {
      // override for register page
      if (router.asPath.startsWith("/organisations/register")) {
        setNavbarColor("bg-purple");
        return;
      }

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

      //   // admins sees blue
      //   // if (router.asPath.startsWith("/admin")) setNavbarColor("bg-blue");
      //   // // everyone else sees purple (public youth)
      //   // else setNavbarColor("bg-purple");
    }
  }, [
    router,
    session,
    setNavbarColor,
    setCurrentOrganisationIdAtom,
    setCurrentOrganisationLogoAtom,
    setactiveNavigationRoleViewAtom,
    currentOrganisationIdValue,
  ]);

  return null;
};
