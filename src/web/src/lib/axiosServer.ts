import axios from "axios";
import {
  type GetStaticPropsContext,
  type GetServerSidePropsContext,
} from "next";
import { env } from "~/env.mjs";
import { getServerAuthSession } from "~/server/auth";
import { toLogSafeError } from "./apiErrorUtils";

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

  instance.interceptors.request.use(
    async (request) => {
      // for server-side requests, reuse the session already resolved for this request
      const session = isGetServerSidePropsContext(context)
        ? await getServerAuthSession(context)
        : null;

      if (session) {
        request.headers.Authorization = `Bearer ${session.accessToken}`;
      } else {
        request.headers.Authorization = undefined;
      }

      return request;
    },
    (error) => {
      console.error("API Error:", toLogSafeError(error));
      throw error;
    },
  );

  return instance;
};

export default ApiServer;
