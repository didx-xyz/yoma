import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type DefaultUser,
  type NextAuthOptions,
} from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import KeycloakProvider from "next-auth/providers/keycloak";
import { User as YomaUserProfile } from "~/api/models/user";
import { env } from "~/env.mjs";

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
interface User extends DefaultUser {
  // ...other properties
  roles: string[];
  profile: YomaUserProfile;
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

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // get roles from access_token
        const { realm_access } = decode(account.access_token); // eslint-disable-line

        // get user profile from yoma-api
        var userProfile = await getYomaUserProfile(account.access_token!);

        return {
          accessToken: account.accessToken,
          accessTokenExpires: account.expires_at,
          refreshToken: account.refresh_token,
          user: {
            ...user,
            roles: realm_access.roles, // eslint-disable-line
            profile: userProfile,
          },
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    // eslint-disable-next-line
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.error = token.error;
      }

      return session;
    },
  },
  providers: [
    KeycloakProvider({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,
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
};

// eslint-disable-next-line
const decode = function (token: any) {
  // eslint-disable-next-line
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
};

async function getYomaUserProfile(access_token: string): Promise<User | null> {
  const response = await fetch(`${env.API_BASE_URL}/user`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    console.error(
      "Failed to get user profile from yoma-api: " + response.statusText
    );
    return null;
  }

  return await response.json(); // eslint-disable-line
}

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
// eslint-disable-next-line
async function refreshAccessToken(token: any) {
  try {
    console.log("Refreshing access token...");

    const url = process.env.KEYCLOAK_ISSUER + "/protocol/openid-connect/token?";

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!, // eslint-disable-line
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!, // eslint-disable-line
        grant_type: "refresh_token",
        refresh_token: token.refreshToken, // eslint-disable-line
      }),
    });

    const refreshedTokens = await response.json(); // eslint-disable-line

    if (!response.ok) {
      throw refreshedTokens;
    }

    /* eslint-disable */
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
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
