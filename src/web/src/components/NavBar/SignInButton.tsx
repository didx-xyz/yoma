import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { fetchClientEnv } from "~/lib/utils";

export const SignInButton: React.FC = () => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleLogin = async () => {
    setIsButtonLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
    );
  };

  return (
    <button
      type="button"
      className="hover:bg-transparentx hover:brightness-50x btn w-[120px] gap-2 border-0 border-none bg-transparent px-2 disabled:brightness-50"
      onClick={handleLogin}
      disabled={isButtonLoading}
    >
      {isButtonLoading && (
        <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-8 w-8 text-white" />}
      <p className="uppercase text-white">Sign In</p>
    </button>
  );
};
