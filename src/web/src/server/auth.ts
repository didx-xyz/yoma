import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type DefaultUser,
  type NextAuthOptions,
} from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import KeycloakProvider from "next-auth/providers/keycloak";
import { type UserProfile } from "~/api/models/user";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User;
    accessToken: string;
    error: unknown;
  }
}
export interface User extends DefaultUser {
  roles: string[];
  adminsOf: string[];
}
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** OpenID ID Token */
    idToken?: string;
    user: User;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
  }
}

const COOKIES_LIFE_TIME = 24 * 60 * 60;
const COOKIE_PREFIX =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ENVIRONMENT !== "local"
    ? "__Secure-"
    : "";
const CLIENT_WEB = "yoma-web";
const CLIENT_GOODWALL = "goodwall";
const CLIENT_ATINGI = "atingi";

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
  },
  events: {
    async signOut({ token }) {
      // get the client id & secret based on the provider
      const { client_id, client_secret } = getClientIdAndSecretForProvider(
        token.provider,
      );

      const url = new URL(
        `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
      );

      url.searchParams.set("id_token_hint", token.idToken!);
      url.searchParams.set("client_id", client_id);
      url.searchParams.set("client_secret", client_secret);
      url.searchParams.set("refresh_token", token.refreshToken);

      // invalidates the session, but doesn't delete it
      const response = await fetch(url.toString());
      if (!response.ok) {
        const message = `An error has occurred: ${response.status}`;
        console.error(message);
        throw new Error(message);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // called when the user profile is updated (update function from settings.tsx)
      // also used to force a refresh of token (/organisation/register/index.tsx)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (trigger === "update") {
        token.user = session.user;
        return refreshAccessToken(token);
      }

      // Initial sign in
      if (account && user) {
        // get roles from access_token
        const { realm_access } = decode(account.access_token); // eslint-disable-line

        // get user profile from yoma-api
        const userProfile = await getYomaUserProfile(account.access_token!);

        return {
          idToken: account.id_token, // needed for signout event (id_token_hint)
          accessToken: account.accessToken,
          accessTokenExpires: account.expires_at,
          refreshToken: account.refresh_token,
          user: {
            ...user,
            roles: realm_access.roles, // eslint-disable-line
            adminsOf: userProfile?.adminsOf.map((org) => org.id) ?? [],
          },
          provider: account.provider, //NB: used to determine which client id & secret to use when refreshing token
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired or trigger is update, try to update it
      return refreshAccessToken(token);
    },
    // eslint-disable-next-line
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.error = token.error;
        session.expires = new Date(token.accessTokenExpires).toISOString();
      }

      return session;
    },
  },
  providers: [
    // YOMA-WEB CLIENT
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      id: CLIENT_WEB,
      name: "Yoma",
    }),
    // GOODWALL
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_GOODWALL_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_GOODWALL_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      id: CLIENT_GOODWALL,
      name: "Goodwall",
    }),
    // ATINGI
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ATINGI_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_ATINGI_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      id: CLIENT_ATINGI,
      name: "Atingi",
    }),

    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  secret: process.env.NEXTAUTH_SECRET,

  // FIX: OAUTH_CALLBACK_ERROR State cookie was missing
  // https://github.com/nextauthjs/next-auth/discussions/7491
  cookies: {
    sessionToken: {
      name: `${COOKIE_PREFIX}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `${COOKIE_PREFIX}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `${COOKIE_PREFIX}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: `${COOKIE_PREFIX}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: COOKIES_LIFE_TIME,
      },
    },
    state: {
      name: `${COOKIE_PREFIX}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: COOKIES_LIFE_TIME,
      },
    },
    nonce: {
      name: `${COOKIE_PREFIX}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};

// eslint-disable-next-line
const decode = function (token: any) {
  // eslint-disable-next-line
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
// eslint-disable-next-line
async function refreshAccessToken(token: any) {
  try {
    const url = process.env.KEYCLOAK_ISSUER + "/protocol/openid-connect/token?";

    // get the client id & secret based on the provider
    const { client_id, client_secret } = getClientIdAndSecretForProvider(
      token.provider,
    );

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: client_id,
        client_secret: client_secret,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken, // eslint-disable-line
      }),
    });

    const refreshedTokens = await response.json(); // eslint-disable-line

    if (!response.ok) {
      throw refreshedTokens;
    }

    // get roles from access_token
    const { realm_access } = decode(refreshedTokens.access_token); // eslint-disable-line

    // get user profile from yoma-api
    const userProfile = await getYomaUserProfile(refreshedTokens.access_token!);

    /* eslint-disable */
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      user: {
        ...token.user,
        roles: realm_access.roles, // eslint-disable-line
        adminsOf: userProfile?.adminsOf.map((org) => org.id) ?? [],
      },
    };
    /* eslint-enable */
  } catch (error) {
    console.log(error);

    /* eslint-disable */
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
    /* eslint-enable */
  }
}

async function getYomaUserProfile(
  access_token: string,
): Promise<UserProfile | null> {
  const response = await fetch(`${process.env.API_BASE_URL}/user`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    console.error(
      "Failed to get user profile from yoma-api: " + response.statusText,
    );
    return null;
  }

  return await response.json(); // eslint-disable-line
}

function getClientIdAndSecretForProvider(provider: unknown) {
  let client_id = "";
  let client_secret = "";
  if (provider === CLIENT_WEB) {
    client_id = process.env.KEYCLOAK_CLIENT_ID!;
    client_secret = process.env.KEYCLOAK_CLIENT_SECRET!;
  } else if (provider === CLIENT_GOODWALL) {
    client_id = process.env.KEYCLOAK_GOODWALL_CLIENT_ID!;
    client_secret = process.env.KEYCLOAK_GOODWALL_CLIENT_SECRET!;
  } else if (provider === CLIENT_ATINGI) {
    client_id = process.env.KEYCLOAK_ATINGI_CLIENT_ID!;
    client_secret = process.env.KEYCLOAK_ATINGI_CLIENT_SECRET!;
  } else {
    throw new Error("Invalid provider");
  }
  return { client_id, client_secret };
}
/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
