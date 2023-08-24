import axios from "axios";
import { type Session } from "next-auth";
import { getSession } from "next-auth/react";
import { env } from "~/env.mjs";

let lastSession: Session | null = null;

// Axios instance for client-side requests
const ApiClient = () => {
  const instance = axios.create({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  });

  instance.interceptors.request.use(
    async (request) => {
      if (lastSession == null || Date.now() > Date.parse(lastSession.expires)) {
        const session = await getSession();
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

export default ApiClient();
