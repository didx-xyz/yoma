import { signIn, signOut } from "next-auth/react";
import { destroyCookie } from "nookies";
import { COOKIE_KEYCLOAK_SESSION } from "~/lib/constants";
import analytics from "~/lib/analytics";
import { fetchClientEnv } from "~/lib/utils";

export const handleUserSignIn = async (currentLanguage: string) => {
  // 📊 ANALYTICS: track login attempt
  analytics.auth.loginAttempt("keycloak");

  // ensure signInAgain query string parameter is not present
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  searchParams.delete("signInAgain");

  // Construct the callbackUrl without trailing "/?" if there are no query parameters
  const callbackUrl = searchParams.toString()
    ? `${currentUrl.origin}${currentUrl.pathname}?${searchParams.toString()}`
    : `${currentUrl.origin}${currentUrl.pathname}`;

  // log in with keycloak
  signIn(
    ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
      "") as string,
    {
      callbackUrl: callbackUrl,
    },
    { ui_locales: currentLanguage }, // pass the current language to the keycloak provider
  );
};

export const handleUserSignOut = async (
  signInAgain?: boolean,
  skipKeycloakLogout?: boolean,
) => {
  console.log("handleUserSignOut called", {
    signInAgain,
    skipKeycloakLogout,
    timestamp: new Date().toISOString(),
  });

  // 📊 ANALYTICS: track logout
  analytics.auth.logout();

  // Construct the callbackUrl with the loginAgain query parameter
  let callbackUrl = `${window.location.origin}/`;

  if (!!signInAgain) {
    callbackUrl += `?signInAgain=${signInAgain}`;
  }

  // Skip Keycloak logout if session is already expired/invalid
  if (skipKeycloakLogout) {
    console.log("Skipping Keycloak logout - performing local cleanup only");

    // Clean up local state when skipping Keycloak
    destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
      path: "/",
      maxAge: 0,
    });

    // Redirect directly since we're not calling Keycloak
    window.location.href = callbackUrl;
    return;
  }

  try {
    console.log("Calling NextAuth signOut...");

    // 🔧 FIX: Call signOut FIRST, then clean up cookies
    // This allows NextAuth to properly communicate with Keycloak for logout
    await signOut({
      callbackUrl: callbackUrl,
    });

    console.log("NextAuth signOut completed successfully");

    // Only clean up after successful logout
    destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
      path: "/",
      maxAge: 0,
    });
  } catch (error) {
    console.warn("Logout failed, cleaning up local state anyway:", error);

    // Clean up local state even if Keycloak logout failed
    destroyCookie(null, COOKIE_KEYCLOAK_SESSION, {
      path: "/",
      maxAge: 0,
    });

    // Manual redirect if signOut failed
    window.location.href = callbackUrl;
    return;
  }
};
