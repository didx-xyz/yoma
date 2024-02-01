import axios from "axios";
import { GetStaticPropsContext, type GetServerSidePropsContext } from "next";
import { getServerSession, type Session } from "next-auth";
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";

function isGetServerSidePropsContext(
  obj: any,
): obj is GetServerSidePropsContext {
  return (
    "req" in obj &&
    "res" in obj &&
    "query" in obj &&
    "params" in obj &&
    "preview" in obj &&
    "previewData" in obj
  );
}
function isGetStaticPropsContext(obj: any): obj is GetStaticPropsContext {
  return (
    "params" in obj &&
    "preview" in obj &&
    "previewData" in obj &&
    "locale" in obj &&
    "locales" in obj &&
    "defaultLocale" in obj
  );
}

// Axios instance for server-side requests
const ApiServer = (
  context: GetServerSidePropsContext | GetStaticPropsContext,
) => {
  const instance = axios.create({
    baseURL: env.API_BASE_URL,
  });

  let lastSession: Session | null = null;

  instance.interceptors.request.use(
    async (request) => {
      if (isGetServerSidePropsContext(context)) {
        if (
          lastSession == null ||
          Date.now() > Date.parse(lastSession.expires)
        ) {
          // get server session from ServerSidePropsContext
          if (isGetServerSidePropsContext(context)) {
            const session = await getServerSession(
              context.req,
              context.res,
              authOptions,
            );
            lastSession = session;
          }

          // get server session from StaticPropsContext
          if (isGetStaticPropsContext(context)) {
            const session = await getServerSession(authOptions);

            lastSession = session;
          }
        }
      }

      if (lastSession) {
        request.headers.Authorization = `Bearer ${lastSession.accessToken}`;
      } else {
        request.headers.Authorization = undefined;
      }

      return request;
    },
    (error) => {
      console.error(`API Error: `, error);
      throw error;
    },
  );

  return instance;
};

export default ApiServer;
