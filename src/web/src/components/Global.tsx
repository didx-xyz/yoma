import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import iconBell from "public/images/icon-bell.webp";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";
import YoIDCard from "public/images/YoID-modal-card.webp";
import { useCallback, useEffect, useState } from "react";
import ReactModal from "react-modal";
import { toast } from "react-toastify";
import type { UserProfile } from "~/api/models/user";
import { getOrganisationById } from "~/api/services/organisations";
import { getUserProfile, patchYoIDOnboarding } from "~/api/services/user";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { handleUserSignIn } from "~/lib/authUtils";
import {
  COOKIE_KEYCLOAK_SESSION,
  GA_ACTION_USER_YOIDONBOARDINGCONFIRMED,
  GA_CATEGORY_USER,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  SETTING_USER_SETTINGS_CONFIGURED,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import {
  RoleView,
  activeNavigationRoleViewAtom,
  currentLanguageAtom,
  currentOrganisationIdAtom,
  currentOrganisationInactiveAtom,
  currentOrganisationLogoAtom,
  screenWidthAtom,
  userProfileAtom,
} from "~/lib/store";
import { SignInButton } from "./SignInButton";
import { ApiErrors } from "./Status/ApiErrors";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "./User/UserProfileForm";

// * GLOBAL APP CONCERNS
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
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
  const setScreenWidthAtom = useSetAtom(screenWidthAtom);

  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [onboardingDialogVisible, setOnboardingDialogVisible] = useState(false);
  const [updateProfileDialogVisible, setUpdateProfileDialogVisible] =
    useState(false);

  const [isYoIDOnboardingLoading, setIsYoIDOnboardingLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const currentLanguage = useAtomValue(currentLanguageAtom);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(
    loginDialogVisible || onboardingDialogVisible || updateProfileDialogVisible,
  );

  //#region Functions
  const postLoginChecks = useCallback(
    (userProfile: UserProfile) => {
      const isUserProfileCompleted = (userProfile: UserProfile) => {
        if (!userProfile) return null;

        const {
          firstName,
          surname,
          displayName,
          //phoneNumber, ignore phone number for now
          countryId,
          educationId,
          genderId,
          dateOfBirth,
        } = userProfile;

        if (
          !firstName ||
          !surname ||
          !displayName ||
          //!phoneNumber || ignore phone number for now
          !countryId ||
          !educationId ||
          !genderId ||
          !dateOfBirth
        ) {
          return false;
        }

        return true;
      };

      if (!userProfile) return;

      if (!userProfile.yoIDOnboarded) {
        // show onboarding dialog if not onboarded
        setOnboardingDialogVisible(true);
      } else if (!isUserProfileCompleted(userProfile)) {
        // show update profile dialog if profile completed
        setUpdateProfileDialogVisible(true);
      } else if (
        !userProfile?.settings?.items.find(
          (x) => x.key === SETTING_USER_SETTINGS_CONFIGURED,
        )?.value
      )
        // show toast if settings not configured
        toast.warn(
          "Your application settings have not be configured. Please click here to configure them now.",
          {
            onClick: () => {
              router.push("/user/settings").then(() => null);
            },
            autoClose: false,
            closeOnClick: true,
          },
        );
    },
    [router, setOnboardingDialogVisible, setUpdateProfileDialogVisible],
  );
  //#endregion Functions

  //#region Event Handlers
  // 🔔 POST SIGN-IN
  // get user profile after sign in & perform post login checks
  useEffect(() => {
    // TODO: disabled for now. need to fix issue with GA login event beging tracked twice
    if (sessionStatus === "loading") return;

    // check error
    if (session?.error) {
      setLoginMessage("There was an error signing in. Please sign in again.");
      return;
    }

    // check existing session
    if (session) {
      // skip if userProfile already set
      if (userProfile) return;

      // get user profile
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

          postLoginChecks(res);
        })
        .catch((e) => {
          if (e.response?.status === 401) {
            // show dialog to login again
            setLoginMessage("Your session has expired. Please sign in again.");
            setLoginDialogVisible(true);
          }

          console.error(e);
        });
    }
    // check if external partner session exists i.e keycloak session cookie
    // if it does, perform the sign-in action (SSO)
    // this will redirect to keycloak, automatically sign the user in and redirect back to the app
    else {
      const cookies = parseCookies();
      const existingSessionCookieValue = cookies[COOKIE_KEYCLOAK_SESSION];

      if (existingSessionCookieValue) {
        // sign in with keycloak
        handleUserSignIn(currentLanguage);
      }
    }
  }, [
    session,
    sessionStatus,
    userProfile,
    currentLanguage,
    setUserProfile,
    postLoginChecks,
  ]);

  // 🔔 VIEWPORT DETECTION
  // track the screen size for responsive elements
  useEffect(() => {
    function onResize() {
      setScreenWidthAtom(window.innerWidth);
    }
    onResize();
    window.addEventListener("resize", onResize);

    // 👇️ remove the event listener when component unmounts
    return () => window.removeEventListener("resize", onResize);
  }, [setScreenWidthAtom]);

  // 🔔 ROUTE CHANGE HANDLER
  // set the active navigation role view atom based on the route
  // this is used to determine which navigation items & profile image to show (for organisation admin pages)
  useEffect(() => {
    if (!session) {
      setActiveNavigationRoleViewAtom(RoleView.User);
      return;
    }

    // set the active navigation role view atom (based on roles)
    const isAdmin = session?.user?.roles.includes(ROLE_ADMIN);
    const isOrgAdmin = session?.user?.roles.includes(ROLE_ORG_ADMIN);

    setActiveNavigationRoleViewAtom(RoleView.User);

    // check for "current" organisation
    if (
      router.asPath.startsWith("/admin") ||
      router.asPath.startsWith("/organisations")
    ) {
      if (isAdmin) setActiveNavigationRoleViewAtom(RoleView.Admin);
      else if (isOrgAdmin) setActiveNavigationRoleViewAtom(RoleView.OrgAdmin);

      // override for registration page (no "current" organisation)
      if (router.asPath.startsWith("/organisations/register")) {
        return;
      }

      // check for "current" organisation page (contains organisation id in route)
      const matches = router.asPath.match(/\/organisations\/([a-z0-9-]{36})/);

      if (matches && matches.length > 1) {
        const orgId = matches[1];
        if (!orgId) return;

        // override the active navigation role view if admin of the organisation
        if (session.user.adminsOf.includes(orgId)) {
          setActiveNavigationRoleViewAtom(RoleView.OrgAdmin);
        } else if (isAdmin) setActiveNavigationRoleViewAtom(RoleView.Admin);

        if (orgId != currentOrganisationIdValue) {
          // update atom (navbar items)
          setCurrentOrganisationIdAtom(orgId);

          // get the organisation logo, update atom (change user image to company logo)
          getOrganisationById(orgId).then((res) => {
            if (res.logoURL) setCurrentOrganisationLogoAtom(res.logoURL);
            else setCurrentOrganisationLogoAtom(null);

            setCurrentOrganisationInactiveAtom(res.status !== "Active");
          });
        }
      } else {
        setCurrentOrganisationIdAtom(null);
        setCurrentOrganisationLogoAtom(null);
        setCurrentOrganisationInactiveAtom(false);
      }
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

  // 🔔 CHECK SESSION
  // show login dialog if session error
  useEffect(() => {
    if (session?.error) {
      // show dialog to login again
      if (session?.error === "RefreshAccessTokenError") {
        setLoginMessage("Your session has expired. Please sign in again.");
        setLoginDialogVisible(true);
      } else {
        setLoginMessage("There was an error signing in. Please sign in again.");
        setLoginDialogVisible(true);
      }

      console.error("session error: ", session?.error);
    }
  }, [session?.error, setLoginDialogVisible, setLoginMessage]);

  // 🔔 CLICK HANDLER: ONBOARDING DIALOG CONFIRMATION
  const onClickYoIDOnboardingConfirm = useCallback(async () => {
    try {
      setIsYoIDOnboardingLoading(true);
      toast.dismiss();

      // update API
      const userProfile = await patchYoIDOnboarding();

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_USER,
        GA_ACTION_USER_YOIDONBOARDINGCONFIRMED,
        `User confirmed Yo-ID onboarding message at ${new Date().toISOString()}`,
      );

      // update ATOM
      setUserProfile(userProfile);

      // toast
      toast.success("Yo-ID activated successfully", { autoClose: 5000 });

      // hide popup
      setOnboardingDialogVisible(false);
      setIsYoIDOnboardingLoading(false);

      // perform post login checks
      postLoginChecks(userProfile);
    } catch (error) {
      console.error(error);
      setIsYoIDOnboardingLoading(false);
      toast(<ApiErrors error={error} />, {
        type: "error",
        autoClose: false,
        icon: false,
      });
    }
  }, [setUserProfile, setOnboardingDialogVisible, postLoginChecks]);
  //#endregion Event Handlers

  return (
    <>
      {/* YoID ONBOARDING DIALOG */}
      <ReactModal
        isOpen={onboardingDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setOnboardingDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden overflow-y-auto bg-white animate-in fade-in md:m-auto md:max-h-[700px] md:w-[500px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="relative flex h-32 flex-row bg-green p-4">
            <h1 className="flex-grow"></h1>
            <Image
              src={stamp1}
              alt="Stamp1"
              height={179}
              width={135}
              sizes="100vw"
              priority={true}
              className="absolute left-[10%] z-0 -rotate-3 opacity-70 mix-blend-plus-lighter"
            />
            <Image
              src={stamp2}
              alt="Stamp2"
              height={184}
              width={161}
              sizes="100vw"
              priority={true}
              className="absolute right-0 z-0 rotate-12 opacity-70 mix-blend-plus-lighter"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-8 px-6 pb-8 text-center md:px-12">
            <div className="z-30 -mb-6 -mr-4 -mt-24 flex items-center justify-center">
              <Image
                src={YoIDCard}
                alt="Yo-ID Card"
                width={300}
                height={300}
                sizes="100vw"
                priority={true}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h5 className="text-sm font-semibold tracking-widest">
                EXCITING UPDATE
              </h5>
              <h4 className="text-2xl font-semibold tracking-wide">
                Connected with one profile!
              </h4>
            </div>
            <p className="text-gray-dark">
              Introducing Yo-ID, your Learning Identity Passport. Log in easily
              across all Yoma Partners while we keep your info safe and secure.
            </p>
            <p className="text-gray-dark">
              Please note to use your passport, and receive credentials, you
              will need to activate your Yo-ID.{" "}
              <br className="hidden md:inline" /> Your passport will be
              populated with your Yo-ID and previously completed opportunities
              within 24 hours.
            </p>
            <div className="mt-4 flex flex-grow flex-col items-center gap-6">
              <button
                type="button"
                className="btn btn-primary btn-wide rounded-full normal-case text-white"
                onClick={onClickYoIDOnboardingConfirm}
                disabled={isYoIDOnboardingLoading}
              >
                {isYoIDOnboardingLoading && isYoIDOnboardingLoading ? (
                  <span className="loading loading-spinner">loading</span>
                ) : (
                  <span>Activate your Yo-ID</span>
                )}
              </button>
              <Link
                href="https://docs.yoma.world/technology/what-is-yoid"
                target="_blank"
                className="text-purple hover:underline"
              >
                Find out more
              </Link>
            </div>
          </div>
        </div>
      </ReactModal>

      {/* LOGIN AGAIN DIALOG */}
      <ReactModal
        isOpen={loginDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setLoginDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white outline-1 animate-in fade-in hover:outline-1 md:m-auto md:max-h-[280px] md:w-[450px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-theme flex h-16 flex-row p-4 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-purple-dark bg-white shadow-lg">
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

            <h5>{loginMessage}</h5>

            <div className="mt-8 flex flex-grow gap-4">
              <SignInButton />
            </div>
          </div>
        </div>
      </ReactModal>

      {/* UPDATE PROFILE DIALOG */}
      <ReactModal
        isOpen={updateProfileDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setUpdateProfileDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden overflow-y-auto bg-white animate-in fade-in md:m-auto md:max-h-[700px] md:w-[500px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-theme flex h-16 flex-row p-8 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-purple-dark bg-white shadow-lg">
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

            <div className="flex flex-col gap-2">
              <h5 className="text-sm font-semibold tracking-widest">
                PROFILE UPDATE
              </h5>
              <h4 className="text-2xl font-semibold tracking-wide">
                Update your Yo-ID
              </h4>
            </div>

            <p className="text-sm text-gray-dark">
              We want to make sure your details are up to date. Please take a
              moment to review and update your profile.
            </p>

            <div className="max-w-[300px] md:max-w-md">
              <UserProfileForm
                userProfile={userProfile}
                onSubmit={(updatedUserProfile) => {
                  // hide popup
                  setUpdateProfileDialogVisible(false);

                  // perform login checks (again)
                  postLoginChecks(updatedUserProfile);
                }}
                filterOptions={[
                  UserProfileFilterOptions.FIRSTNAME,
                  UserProfileFilterOptions.SURNAME,
                  UserProfileFilterOptions.DISPLAYNAME,
                  UserProfileFilterOptions.PHONENUMBER,
                  UserProfileFilterOptions.COUNTRY,
                  UserProfileFilterOptions.EDUCATION,
                  UserProfileFilterOptions.GENDER,
                  UserProfileFilterOptions.DATEOFBIRTH,
                ]}
              />
            </div>
          </div>
        </div>
      </ReactModal>
    </>
  );
};
