import axios from "axios";
import {
  type GetStaticPropsContext,
  type GetServerSidePropsContext,
} from "next";
import { getServerSession, type Session } from "next-auth";
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";

function isGetServerSidePropsContext(
  obj: any,
): obj is GetServerSidePropsContext {
  return "req" in obj && "res" in obj;
}

// Axios instance for server-side requests
// This is used in getServerSideProps and getStaticProps to make requests to the API
// When getServerSideProps is used, the instance will be created with the auth token from the session (as this is called server-side for server-rendered pages)
// When getStaticProps is used, the instance will be created with no auth token (as this is called build-time for static pages)
const ApiServer = (
  context: GetServerSidePropsContext | GetStaticPropsContext,
) => {
  const instance = axios.create({
    baseURL: env.API_BASE_URL,
  });

  let lastSession: Session | null = null;

  instance.interceptors.request.use(
    async (request) => {
      // for server-side requests, get the session from the request
      if (isGetServerSidePropsContext(context)) {
        if (
          lastSession == null ||
          Date.now() > Date.parse(lastSession.expires)
        ) {
          lastSession = await getServerSession(
            context.req,
            context.res,
            authOptions,
          );
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
