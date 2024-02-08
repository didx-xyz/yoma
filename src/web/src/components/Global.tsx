import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { getOrganisationById } from "~/api/services/organisations";
import { getUserProfile, patchYoIDOnboarding } from "~/api/services/user";
import {
  GA_ACTION_USER_LOGIN_AFTER,
  GA_ACTION_USER_YOIDONBOARDINGCONFIRMED,
  GA_CATEGORY_USER,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
} from "~/lib/constants";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentOrganisationIdAtom,
  currentOrganisationInactiveAtom,
  currentOrganisationLogoAtom,
  smallDisplayAtom,
  userProfileAtom,
} from "~/lib/store";
import ReactModal from "react-modal";
import { IoMdThumbsUp } from "react-icons/io";
import iconBell from "public/images/icon-bell.webp";
import Image from "next/image";
import { toast } from "react-toastify";
import { ApiErrors } from "./Status/ApiErrors";
import { trackGAEvent } from "~/lib/google-analytics";

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
  const setCurrentOrganisationInactiveAtom = useSetAtom(
    currentOrganisationInactiveAtom,
  );
  const setSmallDisplay = useSetAtom(smallDisplayAtom);

  const [onboardingDialogVisible, setOnboardingDialogVisible] = useState(false);

  // 🔔 USER PROFILE
  useEffect(() => {
    //TODO: disabled for now. need to fix issue with GA login event beging tracked twice
    // skip if not logged in or userProfile atom already set (atomWithStorage)
    //if (!session || userProfile) return;

    if (!userProfile) {
      getUserProfile()
        .then((res) => {
          // update atom
          setUserProfile(res);

          // 📊 GOOGLE ANALYTICS: track event
          // trackGAEvent(
          //   GA_CATEGORY_USER,
          //   GA_ACTION_USER_LOGIN_AFTER,
          //   "User logged in",
          // );

          // show onboarding dialog if not onboarded
          if (!res.yoIDOnboarded) {
            setOnboardingDialogVisible(true);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [session, userProfile, setUserProfile, setOnboardingDialogVisible]);

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

    // set the active navigation role view atom (based on roles)
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

    // override for registration page
    if (router.asPath.startsWith("/organisations/register")) {
      setActiveNavigationRoleViewAtom(RoleView.User);
    }
    //  if organisation page, change navbar links & company logo
    else if (router.asPath.startsWith("/organisations")) {
      const matches = router.asPath.match(/\/organisations\/([a-z0-9-]{36})/);

      if (matches && matches.length > 1) {
        const orgId = matches[1];
        if (!orgId) return;

        // override the active navigation role view if admin of the organisation
        if (session.user.adminsOf.includes(orgId)) {
          setActiveNavigationRoleViewAtom(RoleView.OrgAdmin);
        }

        if (orgId != currentOrganisationIdValue) {
          // update atom (navbar items)
          setCurrentOrganisationIdAtom(orgId);

          // get the organisation logo, update atom (change user image to company logo)
          getOrganisationById(orgId).then((res) => {
            if (res.logoURL) setCurrentOrganisationLogoAtom(res.logoURL);
            else setCurrentOrganisationLogoAtom(null);

            if (res.status !== "Active") {
              setCurrentOrganisationInactiveAtom(true);
            }
          });
        }

        return;
      }
    } else {
      setCurrentOrganisationIdAtom(null);
      setCurrentOrganisationLogoAtom(null);
      setCurrentOrganisationInactiveAtom(false);
    }
  }, [
    router,
    session,
    setCurrentOrganisationIdAtom,
    setCurrentOrganisationLogoAtom,
    setActiveNavigationRoleViewAtom,
    setCurrentOrganisationInactiveAtom,
    currentOrganisationIdValue,
  ]);

  // 🔔 CLICK HANDLER: ONBOARDING DIALOG CONFIRMATION
  const onClickYoIDOnboardingConfirm = useCallback(async () => {
    try {
      toast.dismiss();

      // update API
      const userProfile = await patchYoIDOnboarding();

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_USER,
        GA_ACTION_USER_YOIDONBOARDINGCONFIRMED,
        `User confirmed YoID onboarding message at ${new Date().toISOString()}`,
      );

      // update ATOM
      setUserProfile(userProfile);

      // hide popup
      setOnboardingDialogVisible(false);
    } catch (error) {
      console.error(error);
      toast(<ApiErrors error={error} />, {
        type: "error",
        autoClose: false,
        icon: false,
      });
    }
  }, [setUserProfile, setOnboardingDialogVisible]);

  return (
    <>
      {/* ONBOARDING DIALOG */}
      <ReactModal
        isOpen={onboardingDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setOnboardingDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="flex h-20 flex-row bg-green p-4 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconBell}
                alt="Icon Bell"
                width={28}
                height={28}
                sizes="100vw"
                priority={true}
                style={{ width: "28px", height: "28px" }}
              />
            </div>

            <h4>You have not been onboarded for YoID. </h4>
            <h5>Click the button to continue.</h5>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn rounded-full bg-green normal-case text-white hover:bg-green-dark md:w-[250px]"
                //className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[300px]"
                onClick={onClickYoIDOnboardingConfirm}
              >
                <IoMdThumbsUp className="h-5 w-5 text-white" />

                <p className="text-white">I understand</p>
              </button>
            </div>
          </div>
        </div>
      </ReactModal>
    </>
  );
};
