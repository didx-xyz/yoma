import { useAtomValue } from "jotai";
import React, { useCallback, useState } from "react";
import { IoMdLogIn } from "react-icons/io";
import { handleUserSignIn } from "~/lib/authUtils";
import analytics from "~/lib/analytics";
import { currentLanguageAtom } from "~/lib/store";
import { LoadingInline } from "./Status/LoadingInline";

export const SignInButton: React.FC<{
  className?: string;
  tabIndex?: number;
  hideIcon?: boolean;
  // by default the label is hidden on small screens (icon only); set this to always show it
  showLabel?: boolean;
  // optionally override where the user is returned to after signing in (defaults to the current page)
  callbackUrl?: string;
}> = ({ className, tabIndex, hideIcon, showLabel, callbackUrl }) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const handleLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // 📊 ANALYTICS: track login button click
    analytics.trackEvent("login_button_clicked", {
      language: currentLanguage,
      buttonLocation: "general", // can be customized per usage
    });

    // log in with keycloak
    await handleUserSignIn(currentLanguage, callbackUrl);
  }, [currentLanguage, callbackUrl]);

  return (
    <button
      type="button"
      className={`bg-theme font-nunito btn gap-2 border-0 border-none px-4 shadow-lg hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait disabled:brightness-95 ${className}`}
      onClick={handleLogin}
      disabled={isButtonLoading}
      id="btnSignIn"
      tabIndex={tabIndex}
      title="Login"
    >
      {isButtonLoading && (
        <LoadingInline classNameSpinner="h-5 w-5" classNameLabel="hidden" />
      )}
      {!isButtonLoading && !hideIcon && <IoMdLogIn className="h-5 w-5" />}
      <p
        className={`${hideIcon || showLabel ? "" : "hidden"} font-family-nunito text-base font-semibold sm:block`}
      >
        Login
      </p>
    </button>
  );
};
