import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type Session } from "next-auth";
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";

// Axios instance for server-side requests
const ApiServer = (context: GetServerSidePropsContext) => {
  const instance = axios.create({
    baseURL: env.API_BASE_URL,
  });

  let lastSession: Session | null = null;

  instance.interceptors.request.use(
    async (request) => {
      if (lastSession == null || Date.now() > Date.parse(lastSession.expires)) {
        const session = await getServerSession(
          context.req,
          context.res,
          authOptions,
        );
        lastSession = session;
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
