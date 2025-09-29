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

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  debug: false, // Disable debug to reduce cookie size
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    // Remove debug logging to reduce session size
    // debug(code, metadata) {
    // },
  },
  events: {
    async signOut({ token }) {
      try {
        console.log("🔒 SignOut event triggered");
        console.log("Token details:", {
          hasIdToken: !!token?.idToken,
          hasRefreshToken: !!token?.refreshToken,
          userId: token?.user?.id,
        });

        if (!token?.idToken || !token?.refreshToken) {
          console.warn("⚠️ Missing required tokens for Keycloak logout");
          return; // Skip Keycloak logout if tokens are missing
        }

        // kill the session in keycloak
        const logoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;

        console.log("🔗 Attempting Keycloak logout...");

        const response = await fetch(logoutUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
            refresh_token: token.refreshToken,
          }),
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error("❌ Keycloak logout failed:", {
            status: response.status,
            statusText: response.statusText,
            response: responseText,
            url: logoutUrl,
          });
          // Don't throw error - allow NextAuth logout to continue
        } else {
          console.log("✅ Keycloak logout successful");
          console.log("📊 Response status:", response.status);
        }
      } catch (error) {
        console.error("❌ Error during signOut event:", error);
        // Don't throw error to prevent blocking the logout process
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      const now = Date.now();
      const isExpired =
        token.accessTokenExpires && now >= token.accessTokenExpires;

      // called when the user profile is updated (update function from settings.tsx)
      // also used to force a refresh of token (/organisation/register/index.tsx)
      if (trigger === "update") {
        // Only update token.user if session.user exists, otherwise keep existing
        if (session?.user) {
          token.user = session.user;
        }

        // If token is expired or we're forcing a refresh, refresh it
        if (isExpired || session?.forceRefresh) {
          return refreshAccessToken(token);
        }

        // Otherwise return current token
        return token;
      } // Initial log in
      if (account && user) {
        console.log("🔑 Initial login - User from profile mapping:", {
          id: user.id,
          name: user.name,
          email: user.email,
        });

        // get roles from access_token
        const { realm_access } = decode(account.access_token);

        // get user profile from yoma-api
        const userProfile = await getYomaUserProfile(account.access_token!);

        const newToken = {
          idToken: account.id_token, // needed for signout event (id_token_hint)
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + Number(account.expires_in) * 1000,
          refreshToken: account.refresh_token,
          user: {
            ...user,
            roles: realm_access?.roles ?? [],
            adminsOf: userProfile?.adminsOf.map((org) => org.id) ?? [],
          },
          provider: account.provider, //NB: used to determine which client id & secret to use when refreshing token
        };

        console.log("🎟️ New token created with user ID:", newToken.user.id);
        return newToken;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        // Only include essential user data to reduce cookie size
        session.user = {
          id: token.user.id ?? null,
          name: token.user.name ?? null,
          email: token.user.email ?? null,
          image: token.user.image ?? null,
          roles: token.user.roles ?? [],
          adminsOf: token.user.adminsOf ?? [],
        };
        session.accessToken = token.accessToken;
        session.error = token.error;
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
      // Map userName (preferred_username) to email field for backwards compatibility
      profile(profile) {
        console.log("👤 Keycloak profile received:", {
          sub: profile.sub,
          name: profile.name,
          preferred_username: profile.preferred_username,
          email: profile.email,
        });

        const mappedProfile = {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.preferred_username, // Map userName (email/phone) to email field
          image: profile.picture,
        };

        console.log("🔄 Profile mapped to:", mappedProfile);
        return mappedProfile;
      },
    }),
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
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${COOKIE_PREFIX}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${COOKIE_PREFIX}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: `${COOKIE_PREFIX}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIES_LIFE_TIME,
      },
    },
    state: {
      name: `${COOKIE_PREFIX}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIES_LIFE_TIME,
      },
    },
    nonce: {
      name: `${COOKIE_PREFIX}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const decode = function (token: any) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (error) {
    console.error("Error decoding token:", error);
    return {};
  }
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    const url = process.env.KEYCLOAK_ISSUER + "/protocol/openid-connect/token";

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("❌ Refresh token request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: refreshedTokens,
        url: url,
      });
      throw refreshedTokens;
    }

    // get roles from access_token
    const decodedToken = decode(refreshedTokens.access_token);
    const realm_access = decodedToken?.realm_access;

    // get user profile from yoma-api
    const userProfile = await getYomaUserProfile(refreshedTokens.access_token!);

    const newToken = {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      user: {
        ...token.user,
        roles: realm_access?.roles ?? token.user?.roles ?? [],
        adminsOf:
          userProfile?.adminsOf.map((org) => org.id) ??
          token.user?.adminsOf ??
          [],
      },
    };

    return newToken;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    console.error("❌ Token details:", {
      hasRefreshToken: !!token.refreshToken,
      refreshTokenPreview: token.refreshToken
        ? token.refreshToken.substring(0, 20) + "..."
        : "none",
      keycloakIssuer: process.env.KEYCLOAK_ISSUER,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
    });

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
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

  return await response.json();
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
