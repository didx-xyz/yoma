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

  // ensure signInAgain query string parameter is not present
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  searchParams.delete("signInAgain");

  // Construct the callbackUrl without trailing "/?" if there are no query parameters
  const callbackUrl = searchParams.toString()
    ? `${currentUrl.origin}${currentUrl.pathname}?${searchParams.toString()}`
    : `${currentUrl.origin}${currentUrl.pathname}`;

  // sign in with keycloak
  signIn(
    ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
      "") as string,
    {
      callbackUrl: callbackUrl,
    },
    { ui_locales: currentLanguage }, // pass the current language to the keycloak provider
  );
};

export const handleUserSignOut = (signInAgain?: boolean) => {
  // 📊 GOOGLE ANALYTICS: track event
  trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_LOGOUT, "User logged out");

  // Construct the callbackUrl with the loginAgain query parameter
  let callbackUrl = `${window.location.origin}/`;

  if (!!signInAgain) {
    callbackUrl += `?signInAgain=${signInAgain}`;
  }

  // signout from keycloak
  signOut({
    callbackUrl: callbackUrl,
  }).then(() => {
    // delete the KEYCLOAK_SESSION cookie (prevents signing in again after signout)
    destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
      path: "/",
      maxAge: 0, // expire the cookie immediately
    });
  });
};
