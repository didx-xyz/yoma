import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";

// Keycloak does not know about /auth/return by default.
// Our custom Keycloak theme builds a "Back to Yoma" link as:
//   ${client.baseUrl}/auth/return
// This page runs on the web app domain, where NextAuth's callback cookie exists.
const CALLBACK_URL_COOKIE_NAMES = [
  "__Secure-next-auth.callback-url",
  "next-auth.callback-url",
];

const DEFAULT_DESTINATION = "/";

const decodeCookieValue = (value?: string) => {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const resolveDestination = (context: GetServerSidePropsContext) => {
  // NextAuth stores the original requested URL in its callback-url cookie.
  // We check both the secure and non-secure cookie names because local/dev and
  // deployed environments do not always use the same prefix.
  const rawCookieValue = CALLBACK_URL_COOKIE_NAMES.map(
    (cookieName) => context.req.cookies[cookieName],
  ).find(Boolean);

  const callbackUrl = decodeCookieValue(rawCookieValue);
  if (!callbackUrl) return DEFAULT_DESTINATION;

  const requestHost =
    (context.req.headers["x-forwarded-host"] as string | undefined) ??
    context.req.headers.host;

  try {
    // Allow relative in-app paths directly.
    if (callbackUrl.startsWith("/")) return callbackUrl;

    const targetUrl = new URL(callbackUrl);
    // Only redirect to the same host to avoid turning this route into an open redirect.
    if (requestHost && targetUrl.host === requestHost) {
      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    }
  } catch {
    return DEFAULT_DESTINATION;
  }

  return DEFAULT_DESTINATION;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // This route exists only to translate the saved NextAuth callback URL into
  // a normal app redirect after Keycloak sends the user back via "Back to Yoma".
  return {
    redirect: {
      destination: resolveDestination(context),
      permanent: false,
    },
  };
}

export default function AuthReturnPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return null;
}
