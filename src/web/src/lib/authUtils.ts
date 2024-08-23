import { signIn, signOut } from "next-auth/react";
import { destroyCookie } from "nookies";
import {
  COOKIE_KEYCLOAK_SESSION,
  GA_ACTION_USER_LOGIN_BEFORE,
  GA_ACTION_USER_LOGOUT,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { fetchClientEnv } from "~/lib/utils";

export const handleUserSignIn = async (currentLanguage: string) => {
  // 📊 GOOGLE ANALYTICS: track event
  trackGAEvent(
    GA_CATEGORY_USER,
    GA_ACTION_USER_LOGIN_BEFORE,
    "User Logging In. Redirected to External Authentication Provider",
  );

  // sign in with keycloak
  signIn(
    ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
      "") as string,
    undefined,
    { ui_locales: currentLanguage }, // pass the current language to the keycloak provider
  );
};

export const handleUserSignOut = () => {
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
  });
};
