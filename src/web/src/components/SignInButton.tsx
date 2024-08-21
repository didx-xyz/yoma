import { useAtomValue } from "jotai";
import { signIn } from "next-auth/react";
import React, { useCallback, useState } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { GA_ACTION_USER_LOGIN_BEFORE, GA_CATEGORY_USER } from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { currentLanguageAtom } from "~/lib/store";
import { fetchClientEnv } from "~/lib/utils";
import { LoadingInline } from "./Status/LoadingInline";

export const SignInButton: React.FC<{ className?: string }> = ({
  className = "", // "btn shadow-lg gap-2 border-0 border-none px-4 disabled:!cursor-wait disabled:animate-pulse bg-theme hover:brightness-95 hover:animate-pulsex transition disabled:brightness-95 animate-in animate-out",
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const handleLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(
      GA_CATEGORY_USER,
      GA_ACTION_USER_LOGIN_BEFORE,
      "User Logging In. Redirected to External Authentication Provider",
    );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
      undefined,
      { ui_locales: currentLanguage }, // pass the current language to the keycloak provider
    );
    // setTimeout(() => {
    //   setIsButtonLoading(false);
    // }, 5000);
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
