import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FcCamera, FcKey, FcSettings, FcViewDetails } from "react-icons/fc";
import { IoGift } from "react-icons/io5";
import { toast } from "react-toastify";
import type { SettingsRequest } from "~/api/models/common";
import type { UserProfile } from "~/api/models/user";
import { ReferralParticipationRole } from "~/api/models/user";
import { searchReferralLinkUsagesAsReferee } from "~/api/services/referrals";
import { getOrganisationById } from "~/api/services/organisations";
import {
  getSettings,
  getUserProfile,
  updateSettings,
} from "~/api/services/user";
import { handleUserSignIn } from "~/lib/authUtils";
import {
  COOKIE_KEYCLOAK_SESSION,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  SETTING_USER_SETTINGS_CONFIGURED,
} from "~/lib/constants";
import analytics from "~/lib/analytics";
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
import {
  isUserProfileCompleted,
  isUserSettingsConfigured,
  hasUserPhoto,
} from "~/lib/utils/profile";
import CustomModal from "./Common/CustomModal";
import Suspense from "./Common/Suspense";
import SettingsForm from "./Settings/SettingsForm";
import { SignInButton } from "./SignInButton";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "./User/UserProfileForm";
import { IoMdClose } from "react-icons/io";

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
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [photoUploadDialogVisible, setPhotoUploadDialogVisible] =
    useState(false);
  const [refereeProgressDialogVisible, setRefereeProgressDialogVisible] =
    useState(false);
  const [refereeProgressDialogDismissed, setRefereeProgressDialogDismissed] =
    useState(false);

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

  // Check if user is a referee (has claimed links)
  const isReferee = useMemo(
    () =>
      userProfile?.referral?.roles?.some(
        (role) =>
          role === ReferralParticipationRole.Referee || role === "Referee",
      ) ?? false,
    [userProfile],
  );

  // Fetch referee programs if user is a referee
  const { data: refereeLinkUsages } = useQuery({
    queryKey: ["ReferralLinkUsages", "referee"],
    queryFn: () =>
      searchReferralLinkUsagesAsReferee({
        pageNumber: 1,
        pageSize: 10,
        linkId: null,
        programId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
      }),
    enabled: session !== null && isReferee,
  });

  // Get pending referral programs (as referee)
  const pendingReferralPrograms =
    refereeLinkUsages?.items?.filter((usage) => usage.status === "Pending") ??
    [];

  //#region Functions
  const postLoginChecks = useCallback(
    (userProfile: UserProfile, skipSettings = false) => {
      if (!userProfile) return;

      // Skip profile completion modals on claim page - handled inline there
      if (router.asPath.includes("/referrals/claim/")) {
        return;
      }

      if (!isUserProfileCompleted(userProfile)) {
        // show update profile dialog
        setUpdateProfileDialogVisible(true);
      } else if (!skipSettings && !isUserSettingsConfigured(userProfile)) {
        // show settings dialog
        setSettingsDialogVisible(true);
      } else if (!hasUserPhoto(userProfile)) {
        // show photo upload dialog
        setPhotoUploadDialogVisible(true);
      } else if (pendingReferralPrograms.length > 0) {
        // show referee progress dialog if user has pending referrals
        setRefereeProgressDialogVisible(true);
      } else {
        //toast.success("Welcome back!", { autoClose: false });
      }
    },
    [
      router.asPath,
      setUpdateProfileDialogVisible,
      setSettingsDialogVisible,
      setPhotoUploadDialogVisible,
      setRefereeProgressDialogVisible,
      pendingReferralPrograms,
    ],
  );
  //#endregion Functions

  //#region Event Handlers
  // 🎯 ANALYTICS: Session Management
  // Update analytics user context when session changes
  useEffect(() => {
    // Don't track user changes while session is still loading
    if (sessionStatus === "loading") return;

    analytics.setUser(session?.user || null);
  }, [session, sessionStatus]);

  // 🔔 POST LOG-IN
  // get user profile after log in & perform post login checks
  useEffect(() => {
    // TODO: disabled for now. need to fix issue with GA login event beging tracked twice
    if (sessionStatus === "loading") return;

    // check error
    if (session?.error) {
      setLoginMessage("There was an error signing in. Please log in again.");

      // 📊 ANALYTICS: Track session error with full details
      analytics.trackError(
        `Session error during login check: ${session.error}`,
        {
          errorType: "session_error",
          errorCode: session.error,
          sessionStatus: sessionStatus,
          hasUserProfile: !!userProfile,
          errorLocation: "post_login_check",
        },
      );

      console.error("Session error during login check:", {
        error: session.error,
        sessionStatus,
        hasUserProfile: !!userProfile,
        timestamp: new Date().toISOString(),
      });

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

          postLoginChecks(res);
        })
        .catch((e) => {
          if (e.response?.status === 401) {
            // show dialog to login again
            setLoginMessage("Your session has expired. Please log in again.");
            setLoginDialogVisible(true);

            // Track authentication error
            analytics.trackError("Session expired", {
              errorType: "authentication",
              statusCode: 401,
            });
          } else {
            // show error toast
            toast.error(
              "Something went wrong logging in. Please try again later or contact us for help.",
            );

            // Track login error
            analytics.trackError(e, {
              errorType: "login_error",
              statusCode: e.response?.status,
            });
          }

          console.error(e);
        });
    }
    // check if external partner session exists i.e keycloak session cookie
    // if it does, perform the sign-in action (SSO)
    // this will redirect to keycloak, automatically sign the user in and redirect back to the app
    else {
      // User session clearing is automatically handled by analytics session management

      const cookies = parseCookies();
      const existingSessionCookieValue = cookies[COOKIE_KEYCLOAK_SESSION];

      // check for 'signInAgain' query parameter (user profile email/phone/password reset)
      const urlParams = new URLSearchParams(window.location.search);
      const signInAgain = urlParams.get("signInAgain");

      if (existingSessionCookieValue || signInAgain) {
        // log in with keycloak
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
      // 📊 ANALYTICS: Track session error with comprehensive details
      const errorContext = {
        errorType: "session_validation_error",
        errorCode: session.error,
        sessionStatus: sessionStatus,
        hasUserProfile: !!userProfile,
        errorLocation: "session_validation_check",
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : null,
        currentRoute: router.asPath,
      };

      analytics.trackError(
        `Session validation error: ${session.error}`,
        errorContext,
      );

      console.error("Session validation error:", {
        error: session.error,
        context: errorContext,
        timestamp: new Date().toISOString(),
      });

      // show dialog to login again
      if (session?.error === "RefreshAccessTokenError") {
        setLoginMessage("Your session has expired. Please log in again.");
        setLoginDialogVisible(true);
      } else {
        setLoginMessage("There was an error logging in. Please try again.");
        setLoginDialogVisible(true);
      }

      console.error("session error: ", session?.error);
    }
  }, [
    session?.error,
    sessionStatus,
    userProfile,
    router.asPath,
    setLoginDialogVisible,
    setLoginMessage,
  ]);

  const handleSettingsSubmit = useCallback(
    async (updatedSettings: SettingsRequest) => {
      // ensure that the USER_SETTINGS_CONFIGURED is always set
      // this prevents the "please update your settings" popup from showing again (Global.tsx)
      updatedSettings.settings[SETTING_USER_SETTINGS_CONFIGURED] = true;

      try {
        // call api
        await updateSettings(updatedSettings);

        // 📊 ANALYTICS: track user settings update
        analytics.trackEvent("settings_updated", {
          settingsKeys: Object.keys(updatedSettings.settings),
        });

        // invalidate query
        queryClient.invalidateQueries({
          queryKey: ["user", "settings"],
        });

        // hide popup
        setSettingsDialogVisible(false);

        // perform login checks (again)
        postLoginChecks(userProfile!, true);
      } catch (error) {
        // Track settings update error
        analytics.trackError(error as Error, {
          errorType: "settings_update_error",
        });
        throw error;
      }
    },
    [queryClient, userProfile, setSettingsDialogVisible, postLoginChecks],
  );

  // 🔔 REFEREE PROGRESS CHECK
  // Show referee progress modal when pending referrals are detected
  useEffect(() => {
    // Skip if session is loading or user not logged in
    if (sessionStatus === "loading" || !session || !userProfile) return;

    // Skip if on claim page or referee progress page (handled inline there)
    if (
      router.asPath.includes("/referrals/claim/") ||
      router.asPath.includes("/yoid/referee/")
    )
      return;

    // Skip if user already dismissed the modal
    if (refereeProgressDialogDismissed) return;

    // Skip if any other modals are visible (priority order: profile > settings > photo > referee)
    if (
      updateProfileDialogVisible ||
      settingsDialogVisible ||
      photoUploadDialogVisible
    )
      return;

    // Show referee modal if user has pending referrals
    if (pendingReferralPrograms.length > 0 && !refereeProgressDialogVisible) {
      setRefereeProgressDialogVisible(true);
    }
  }, [
    session,
    sessionStatus,
    userProfile,
    pendingReferralPrograms,
    router.asPath,
    updateProfileDialogVisible,
    settingsDialogVisible,
    photoUploadDialogVisible,
    refereeProgressDialogVisible,
    refereeProgressDialogDismissed,
  ]);
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
                onSubmit={async (updatedUserProfile) => {
                  // update atom with new profile data
                  setUserProfile(updatedUserProfile);

                  // invalidate userProfile query to ensure all components get fresh data
                  await queryClient.invalidateQueries({
                    queryKey: ["userProfile"],
                  });

                  // hide popup
                  setUpdateProfileDialogVisible(false);

                  // perform login checks (again)
                  postLoginChecks(updatedUserProfile);
                }}
                filterOptions={[
                  UserProfileFilterOptions.FIRSTNAME,
                  UserProfileFilterOptions.SURNAME,
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

            <div className="w-full">
              <UserProfileForm
                userProfile={userProfile}
                onSubmit={async (updatedUserProfile) => {
                  // update atom with new profile data (includes photo)
                  setUserProfile(updatedUserProfile);

                  // invalidate userProfile query to ensure all components get fresh data
                  await queryClient.invalidateQueries({
                    queryKey: ["userProfile"],
                  });

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

      {/* REFEREE PROGRESS DIALOG */}
      <CustomModal
        isOpen={refereeProgressDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setRefereeProgressDialogVisible(false);
        }}
        className="md:max-h-[400px] md:w-[600px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-purple flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setRefereeProgressDialogVisible(false);
                setRefereeProgressDialogDismissed(true);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="border-purple-dark -mt-10 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
              <span className="text-2xl">❤️</span>
            </div>

            {pendingReferralPrograms.length === 1 ? (
              <div className="mt-5 flex flex-col gap-2 text-center">
                <div className="text-xl font-semibold tracking-wide">
                  You Have an Active Referral!
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-2 text-center">
                <div className="text-xl font-semibold tracking-wide">
                  You Have Active Referrals!
                </div>
                <div className="text-md text-gray-700">
                  You have {pendingReferralPrograms.length} pending referral
                  programs.
                </div>
              </div>
            )}

            <p className="text-gray-dark text-sm">
              Track your progress and complete the requirements to earn your
              rewards.
            </p>

            <div className="mt-4 flex w-full flex-col gap-3">
              <button
                type="button"
                className="btn btn-secondary w-full text-white"
                onClick={() => {
                  const firstProgramId = pendingReferralPrograms[0]?.programId;
                  if (firstProgramId) {
                    router.push(`/yoid/referee/${firstProgramId}`);
                    setRefereeProgressDialogVisible(false);
                    setRefereeProgressDialogDismissed(true);
                  }
                }}
              >
                Track My Progress
              </button>
              <button
                type="button"
                className="hover:text-green text-sm text-black underline"
                onClick={() => {
                  setRefereeProgressDialogVisible(false);
                  setRefereeProgressDialogDismissed(true);
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </CustomModal>
    </>
  );
};
