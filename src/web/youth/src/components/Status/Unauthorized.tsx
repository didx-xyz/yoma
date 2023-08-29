import { signIn } from "next-auth/react";
import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";
import { env } from "~/env.mjs";

export const Unauthorized: React.FC = () => {
  const handleLogin = () => {
    signIn(env.NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER); // eslint-disable-line @typescript-eslint/no-floating-promises
  };

  return (
    <>
      <Head>
        <title>Yoma Partner | Unauthorized</title>
      </Head>
      <div className="container max-w-md">
        <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
          <h4>401 - Unauthorized</h4>

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
