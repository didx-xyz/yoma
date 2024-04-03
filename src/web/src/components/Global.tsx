import { useAtomValue, useSetAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { getOrganisationById } from "~/api/services/organisations";
import { getUserProfile, patchYoIDOnboarding } from "~/api/services/user";
import {
  GA_ACTION_USER_LOGIN_BEFORE,
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
  screenWidthAtom,
  userProfileAtom,
} from "~/lib/store";
import ReactModal from "react-modal";
import { IoMdFingerPrint } from "react-icons/io";
import iconBell from "public/images/icon-bell.webp";
import YoIDCard from "public/images/YoID-modal-card.webp";
import Image from "next/image";
import { toast } from "react-toastify";
import { ApiErrors } from "./Status/ApiErrors";
import { trackGAEvent } from "~/lib/google-analytics";
import { fetchClientEnv } from "~/lib/utils";
import Link from "next/link";
import stamps from "public/images/stamps.svg";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "./User/UserProfileForm";

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
  const setScreenWidthAtom = useSetAtom(screenWidthAtom);

  const [onboardingDialogVisible, setOnboardingDialogVisible] = useState(false);
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [updateProfileDialogVisible, setUpdateProfileDialogVisible] =
    useState(false);

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isYoIDOnboardingLoading, setIsYoIDOnboardingLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  // SESSION
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

  // function to check if user profile is completed i.e any form field is empty
  const isUserProfileCompleted = useCallback(() => {
    if (!userProfile) return false;

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
  }, [userProfile]);

  // 🔔 USER PROFILE
  useEffect(() => {
    //TODO: disabled for now. need to fix issue with GA login event beging tracked twice
    // skip if not logged in or userProfile atom already set (atomWithStorage)
    //if (!session || userProfile) return;

    if (session && !session?.error && !userProfile) {
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
          } else if (!isUserProfileCompleted()) {
            // show dialog to update profile
            setUpdateProfileDialogVisible(true);
          }
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
  }, [
    session,
    userProfile,
    setUserProfile,
    setOnboardingDialogVisible,
    setUpdateProfileDialogVisible,
    isUserProfileCompleted,
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
        `User confirmed YoID onboarding message at ${new Date().toISOString()}`,
      );

      // update ATOM
      setUserProfile(userProfile);

      //toast
      toast.success("YoID activated successfully", { autoClose: 5000 });

      // hide popup
      setOnboardingDialogVisible(false);
      setIsYoIDOnboardingLoading(false);

      // check if profile completed, if not show update profile dialog
      if (!isUserProfileCompleted()) {
        // show dialog to update profile
        setUpdateProfileDialogVisible(true);
      }
    } catch (error) {
      console.error(error);
      setIsYoIDOnboardingLoading(false);
      toast(<ApiErrors error={error} />, {
        type: "error",
        autoClose: false,
        icon: false,
      });
    }
  }, [setUserProfile, setOnboardingDialogVisible, isUserProfileCompleted]);

  const onLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(
      GA_CATEGORY_USER,
      GA_ACTION_USER_LOGIN_BEFORE,
      "User Logging In. Redirected to External Authentication Provider",
    );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
    );
  }, [setIsButtonLoading]);

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
              src={stamps}
              alt="Stamps"
              height={300}
              width={400}
              sizes="100vw"
              priority={true}
              className="absolute -bottom-5 z-0 -rotate-3 opacity-70 mix-blend-plus-lighter md:left-[10%]"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-8 px-6 pb-8 text-center md:px-12">
            <div className="z-30 -mb-6 -mr-4 -mt-24 flex items-center justify-center">
              <Image
                src={YoIDCard}
                alt="YoID Card"
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
              Introducing YoID, your Learning Identity Passport. Log in easily
              across all Yoma Partners while we keep your info safe and secure.
            </p>
            <p className="text-gray-dark">
              Please note to use your passport, and receive credentials, you
              will need to activate your YoID.{" "}
              <br className="hidden md:inline" /> Your passport will be
              populated with your YoID and previously completed opportunities
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
                  <span>Activate your YoID</span>
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
              <button
                type="button"
                className="bg-theme btn rounded-full normal-case text-white hover:brightness-95 md:w-[150px]"
                onClick={onLogin}
              >
                {isButtonLoading && (
                  <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
                )}
                {!isButtonLoading && (
                  <IoMdFingerPrint className="h-5 w-5 text-white" />
                )}
                <p className="text-white">Login</p>
              </button>
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
                Update your YoID
              </h4>
            </div>

            <p className="text-sm text-gray-dark">
              We want to make sure your details are up to date. Please take a
              moment to review and update your profile.
            </p>

            <div className="max-w-md">
              <UserProfileForm
                userProfile={userProfile}
                onSubmit={() => {
                  setUpdateProfileDialogVisible(false);
                }}
                onCancel={() => {
                  setUpdateProfileDialogVisible(false);
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
