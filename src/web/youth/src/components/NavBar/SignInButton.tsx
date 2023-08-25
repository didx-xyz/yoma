import { signIn } from "next-auth/react";
import React, { useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";

export const SignInButton: React.FC = () => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleLogin = () => {
    setIsButtonLoading(true);

    signIn("keycloak"); // eslint-disable-line @typescript-eslint/no-floating-promises
  };

  return (
    <button
      type="button"
      className="btn-hover-glow btn btn-primary w-[120px] gap-2 px-2"
      onClick={handleLogin}
      disabled={isButtonLoading}
    >
      {isButtonLoading && (
        <div className="lds-dual-ring lds-dual-ring-white h-8 w-8"></div>
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-8 w-8 text-white" />}
      Sign In
    </button>
  );
};
