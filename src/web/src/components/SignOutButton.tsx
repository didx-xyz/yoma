import { useSetAtom } from "jotai";
import { signOut } from "next-auth/react";
import { destroyCookie } from "nookies";
import React, { useCallback, useState } from "react";
import { IoMdLogOut } from "react-icons/io";
import {
  COOKIE_KEYCLOAK_SESSION,
  GA_ACTION_USER_LOGOUT,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { userProfileAtom } from "~/lib/store";
import { LoadingInline } from "./Status/LoadingInline";

export const SignOutButton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const setUserProfile = useSetAtom(userProfileAtom);

  const handleLogout = useCallback(() => {
    setIsButtonLoading(true);

    // update atom
    setUserProfile(null);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_LOGOUT, "User logged out");

    // signout from keycloak
    signOut({
      callbackUrl: `${window.location.origin}/`,
    }).then(() => {
      // delete the KEYCLOAK_SESSION cookie (prevents signing in again after signout)
      destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
        path: "/",
        maxAge: 0, // expire the cookie immediately
      });
    }); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [setIsButtonLoading, setUserProfile]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
      disabled={isButtonLoading}
      id="btnSignOut"
    >
      {isButtonLoading && (
        <LoadingInline
          classNameSpinner="border-white h-6 w-6"
          classNameLabel="hidden"
        />
      )}
      {!isButtonLoading && <IoMdLogOut className="h-6 w-6 text-white" />}
      <p className="uppercasex text-white">Sign Out</p>
    </button>
  );
};
