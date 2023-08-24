import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { env } from "~/env.mjs";

export const SignInButton: React.FC = () => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleLogin = () => {
    setIsButtonLoading(true);

    signIn(env.NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER); // eslint-disable-line @typescript-eslint/no-floating-promises
  };

  return (
    <button
      type="button"
      className="btn  btn-primary w-[120px] gap-2 px-2  disabled:bg-current disabled:brightness-50"
      onClick={handleLogin}
      disabled={isButtonLoading}
    >
      {isButtonLoading && (
        <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-8 w-8 text-white" />}
      <p className="text-white">Sign In</p>
    </button>
  );
};
