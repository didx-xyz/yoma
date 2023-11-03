import axios from "axios";
import { type Session } from "next-auth";
import { getSession } from "next-auth/react";
import { fetchClientEnv } from "./utils";

let apiBaseUrl = "";

// Axios instance for client-side requests
const ApiClient = async () => {
  if (!apiBaseUrl) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiBaseUrl = ((await fetchClientEnv()).NEXT_PUBLIC_API_BASE_URL ||
      "") as string;
  }
  const instance = axios.create({
    baseURL: apiBaseUrl,
  });

  let lastSession: Session | null = null;

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
