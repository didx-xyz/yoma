import { signIn } from "next-auth/react";
import { useState, useCallback } from "react";
import { IoMdFingerPrint } from "react-icons/io";
import { GA_CATEGORY_USER, GA_ACTION_USER_LOGIN_BEFORE } from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { fetchClientEnv } from "~/lib/utils";

export const SignInButon: React.FC = () => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const onLogin = useCallback(async () => {
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
    );
  }, [setIsButtonLoading]);

  return (
    <button
      type="button"
      className="btn rounded-full bg-purple normal-case text-white hover:bg-purple-light md:w-[150px]"
      onClick={onLogin}
    >
      {isButtonLoading && (
        <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
      )}
      {!isButtonLoading && <IoMdFingerPrint className="h-5 w-5 text-white" />}
      <p className="text-white">Sign In</p>
    </button>
  );
};
