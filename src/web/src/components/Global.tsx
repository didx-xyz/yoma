import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";
import YoIDCard from "public/images/YoID-modal-card.webp";
import { useCallback, useEffect, useState } from "react";
import { FcCamera, FcKey, FcSettings, FcViewDetails } from "react-icons/fc";
import { toast } from "react-toastify";
import type { SettingsRequest } from "~/api/models/common";
import type { UserProfile } from "~/api/models/user";
import { getOrganisationById } from "~/api/services/organisations";
import {
  getSettings,
  getUserProfile,
  patchYoIDOnboarding,
  updateSettings,
} from "~/api/services/user";
import { handleUserSignIn } from "~/lib/authUtils";
import {
  COOKIE_KEYCLOAK_SESSION,
  GA_ACTION_APP_SETTING_UPDATE,
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
import CustomModal from "./Common/CustomModal";
import Suspense from "./Common/Suspense";
import SettingsForm from "./Settings/SettingsForm";
import { SignInButton } from "./SignInButton";
import { ApiErrors } from "./Status/ApiErrors";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "./User/UserProfileForm";

// * GLOBAL APP CONCERNS
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  const queryClient = useQueryClient();
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
  const [updateProfileDialogVisible, setUpdateProfileDialogVisible] =
    useState(false);
  const [onboardingDialogVisible, setOnboardingDialogVisible] = useState(false);
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [photoUploadDialogVisible, setPhotoUploadDialogVisible] =
    useState(false);

  const [isYoIDOnboardingLoading, setIsYoIDOnboardingLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const {
    data: settingsData,
    isLoading: settingsIsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["user", "settings"],
    queryFn: async () => await getSettings(),
    enabled: settingsDialogVisible,
  });

  //#region Functions
  const postLoginChecks = useCallback(
    (userProfile: UserProfile, skipSettings = false) => {
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

      if (!isUserProfileCompleted(userProfile)) {
        // show update profile dialog
        setUpdateProfileDialogVisible(true);
      } else if (!userProfile.yoIDOnboarded) {
        // show onboarding dialog
        setOnboardingDialogVisible(true);
      } else if (
        !skipSettings &&
        !userProfile?.settings?.items.find(
          (x) => x.key === SETTING_USER_SETTINGS_CONFIGURED,
        )?.value
      ) {
        // show settings dialog
        setSettingsDialogVisible(true);
      } else if (!userProfile?.photoURL) {
        // show photo upload dialog
        setPhotoUploadDialogVisible(true);
      } else {
        //toast.success("Welcome back!", { autoClose: false });
      }
    },
    [
      setOnboardingDialogVisible,
      setUpdateProfileDialogVisible,
      setSettingsDialogVisible,
      setPhotoUploadDialogVisible,
    ],
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

      // check for 'signInAgain' query parameter (user profile email/phone/password reset)
      const urlParams = new URLSearchParams(window.location.search);
      const signInAgain = urlParams.get("signInAgain");

      if (existingSessionCookieValue || signInAgain) {
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
      let matches = router.asPath.match(/\/organisations\/([a-z0-9-]{36})/);

      let orgId = null;

      if (matches && matches.length > 1) {
        orgId = matches[1];
      } else {
        // check for "current" organisation dashboard page (contains organisation ids in querystring)
        matches = router.asPath.match(
          /\/organisations\/dashboard\?organisations=([a-z0-9-]{36})/,
        );
        if (matches && matches.length > 1) {
          orgId = matches[1];
        }
      }
      if (orgId) {
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

  const handleSettingsSubmit = useCallback(
    async (updatedSettings: SettingsRequest) => {
      // ensure that the USER_SETTINGS_CONFIGURED is always set
      // this prevents the "please update your settings" popup from showing again (Global.tsx)
      updatedSettings.settings[SETTING_USER_SETTINGS_CONFIGURED] = true;

      // call api
      await updateSettings(updatedSettings);

      // 📊 GOOGLE ANALYTICS: track event
      trackGAEvent(
        GA_CATEGORY_USER,
        GA_ACTION_APP_SETTING_UPDATE,
        JSON.stringify(updatedSettings),
      );

      // invalidate query
      queryClient.invalidateQueries({
        queryKey: ["user", "settings"],
      });

      // hide popup
      setSettingsDialogVisible(false);

      // perform login checks (again)
      postLoginChecks(userProfile!, true);
    },
    [queryClient, userProfile, setSettingsDialogVisible, postLoginChecks],
  );
  //#endregion Event Handlers

  return (
    <>
      {/* UPDATE PROFILE DIALOG */}
      <CustomModal
        isOpen={updateProfileDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setUpdateProfileDialogVisible(false);
        }}
        className="md:max-h-[985px] md:w-[700px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex h-16 flex-row p-8 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
              <FcViewDetails className="size-8 md:size-10" />
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-2xl font-semibold tracking-wide">
                Complete your profile
              </h4>
              <h5 className="text-sm font-semibold tracking-widest">
                Information about you
              </h5>
            </div>

            <p className="text-gray-dark text-sm">
              Please take a moment to update your profile to ensure your details
              are current. Your information will be used to issue credentials in
              your Yo-ID wallet.
            </p>

            <div className="w-full">
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
                  UserProfileFilterOptions.COUNTRY,
                  UserProfileFilterOptions.EDUCATION,
                  UserProfileFilterOptions.GENDER,
                  UserProfileFilterOptions.DATEOFBIRTH,
                ]}
              />
            </div>
          </div>
        </div>
      </CustomModal>

      {/* YoID ONBOARDING DIALOG */}
      <CustomModal
        isOpen={onboardingDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setOnboardingDialogVisible(false);
        }}
        className="md:max-h-[640px] md:w-[700px]"
      >
        <div className="flex flex-col gap-2">
          <div className="bg-green relative flex h-32 flex-row p-4">
            <h1 className="grow"></h1>
            <Image
              src={stamp1}
              alt="Stamp1"
              width={135}
              sizes="100vw"
              priority={true}
              className="absolute left-[10%] z-0 h-auto -rotate-3 opacity-70 mix-blend-plus-lighter"
            />
            <Image
              src={stamp2}
              alt="Stamp2"
              width={161}
              sizes="100vw"
              priority={true}
              className="absolute right-0 z-0 h-auto rotate-12 opacity-70 mix-blend-plus-lighter"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-8 px-6 pb-8 text-center md:px-12">
            <div className="z-30 -mt-24 -mr-4 -mb-6 flex items-center justify-center">
              <Image
                src={YoIDCard}
                alt="Yo-ID Card"
                width={300}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-semibold tracking-wide md:text-2xl">
                Activate your Yo-ID!
              </h4>
              <h5 className="text-sm font-semibold tracking-widest">
                Your identity for the Yoma ecosystem.
              </h5>
            </div>

            <div className="text-gray-dark flex max-w-md flex-col gap-4 text-start text-sm">
              <div>
                This will issue you a Yo-ID credential, viewable in your
                passport.
              </div>
              <div>
                We use the blockchain to anchor your achievements on the system.
              </div>
              <div>
                This will in the future unlock verifiabilty behind your record
                on Yoma.
              </div>
              <div>
                So work hard, complete opportunities and build up your
                verifiable impact and learning record.
              </div>
            </div>

            <div className="mt-4 flex grow flex-col items-center gap-6">
              <button
                type="button"
                className="btn btn-primary btn-wide rounded-full text-white normal-case"
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
      </CustomModal>

      {/* SETTINGS DIALOG */}
      <CustomModal
        isOpen={settingsDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setSettingsDialogVisible(false);
        }}
        className="md:max-h-[890px] md:w-[700px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex h-16 flex-row p-8 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 md:px-12">
            <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
              <FcSettings className="size-8 md:size-10" />
            </div>

            <div className="flex flex-col gap-2 text-center">
              <h4 className="text-2xl font-semibold tracking-wide">
                Choose your settings
              </h4>
              <h5 className="text-sm font-semibold tracking-widest">
                Notifications and Privacy
              </h5>
            </div>

            {/* <p className="text-sm text-gray-dark">
              Please take a moment to update your profile to ensure your details
              are current. Your information will be used to issue credentials in
              your Yo-ID wallet.
            </p> */}

            <div className="w-full">
              <Suspense isLoading={settingsIsLoading} error={settingsError}>
                <SettingsForm
                  data={settingsData}
                  onSubmit={handleSettingsSubmit}
                />
              </Suspense>
            </div>

            {/* skip for now link */}
            <button
              type="button"
              className="hover:text-green text-sm text-black underline"
              onClick={() => {
                setSettingsDialogVisible(false);
                postLoginChecks(userProfile!, true);
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </CustomModal>

      {/* UPLOAD PHOTO DIALOG */}
      <CustomModal
        isOpen={photoUploadDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setPhotoUploadDialogVisible(false);
        }}
        className="md:max-h-[680px] md:w-[700px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex h-16 flex-row p-8 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
              <FcCamera className="size-8 md:size-10" />
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-2xl font-semibold tracking-wide">
                Picture time!
              </h4>
              <h5 className="text-sm font-semibold tracking-widest">
                Choose a profile picture
              </h5>
            </div>

            {/* <p className="text-sm text-gray-dark">
              Please take a moment to update your profile to ensure your details
              are current. Your information will be used to issue credentials in
              your Yo-ID wallet.
            </p> */}

            <div className="w-full">
              <UserProfileForm
                userProfile={userProfile}
                onSubmit={() => {
                  // hide popup
                  setPhotoUploadDialogVisible(false);
                }}
                filterOptions={[UserProfileFilterOptions.LOGO]}
              />
            </div>

            {/* skip for now link */}
            <button
              type="button"
              className="hover:text-green text-sm text-black underline"
              onClick={() => {
                setPhotoUploadDialogVisible(false);
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </CustomModal>

      {/* LOGIN AGAIN DIALOG */}
      <CustomModal
        isOpen={loginDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setLoginDialogVisible(false);
        }}
        className="md:max-h-[350px] md:w-[600px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-theme flex h-16 flex-row p-4 shadow-lg"></div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
              <FcKey className="size-8 md:size-10" />
            </div>

            <div className="flex flex-col gap-2 text-center">
              <div className="text-2xl font-semibold tracking-wide">
                Session Expired
              </div>
              <div className="text-md">{loginMessage}</div>
            </div>

            <div className="mt-8 flex grow gap-4">
              <SignInButton />
            </div>
          </div>
        </div>
      </CustomModal>
    </>
  );
};
