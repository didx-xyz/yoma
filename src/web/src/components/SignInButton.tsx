import { useAtomValue } from "jotai";
import React, { useCallback, useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { handleUserSignIn } from "~/lib/authUtils";
import { currentLanguageAtom } from "~/lib/store";
import { LoadingInline } from "./Status/LoadingInline";

export const SignInButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const handleLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // sign in with keycloak
    handleUserSignIn(currentLanguage);
  }, [currentLanguage]);

  return (
    <button
      type="button"
      className={`bg-theme btn gap-2 border-0 border-none px-4 shadow-lg transition animate-in animate-out hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait disabled:brightness-95 ${className}`}
      onClick={handleLogin}
      disabled={isButtonLoading}
      id="btnSignIn"
    >
      {isButtonLoading && (
        <LoadingInline
          classNameSpinner="border-white h-6 w-6"
          classNameLabel="hidden"
        />
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-6 w-6 text-white" />}
      <p className="uppercase text-white">Sign In</p>
    </button>
  );
};
