import { signIn } from "next-auth/react";
import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";
import { fetchClientEnv } from "~/lib/utils";

export const Unauthenticated: React.FC = () => {
  const handleLogin = async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
    );
  };

  return (
    <>
      <Head>
        <title>Yoma | Unauthenticated</title>
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
          <h4>401 - Unauthenticated</h4>

          <FaExclamationTriangle size={100} className="my-10 text-yellow" />

          <p className="p-4 text-sm">
            Please
            <button
              type="button"
              className="btn btn-primary btn-sm mx-2"
              onClick={handleLogin}
            >
              sign in
            </button>
            to view this page.
          </p>
        </div>
      </div>
    </>
  );
};
