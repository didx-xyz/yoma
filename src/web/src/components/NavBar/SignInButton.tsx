import { useAtomValue } from "jotai";
import { signIn } from "next-auth/react";
import React, { useCallback, useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { currentLanguageAtom } from "~/lib/store";
import { fetchClientEnv } from "~/lib/utils";

export const SignInButton: React.FC<{ className?: string }> = ({
  className = "hover:brightness-50x btn gap-2 border-0 border-none bg-transparent px-2 disabled:brightness-50",
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const handleLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
      undefined,
      { ui_locales: currentLanguage }, // pass the current language to the keycloak provider
    );
  }, [currentLanguage]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogin}
      disabled={isButtonLoading}
      id="btnSignIn"
    >
      {isButtonLoading && (
        <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-6 w-6 text-white" />}
      <p className="uppercase text-white">Sign In</p>
    </button>
  );
};
