import React, { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { IoMdLogOut } from "react-icons/io";
import { handleUserSignOut } from "~/lib/authUtils";
import analytics from "~/lib/analytics";
import { LoadingInline } from "./Status/LoadingInline";

export const SignOutButton: React.FC<{
  className?: string;
  tabIndex?: number;
}> = ({ className, tabIndex }) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  const handleLogout = useCallback(async () => {
    setIsButtonLoading(true);

    try {
      // 📊 ANALYTICS: track logout button click
      analytics.trackEvent("logout_button_clicked", {
        buttonLocation: "general",
        sessionStatus: sessionStatus,
        hasSession: !!session,
      });

      // � SIMPLIFIED: Let NextAuth handle session validation
      // Only skip Keycloak if we're absolutely sure there's no session
      if (sessionStatus === "unauthenticated" && !session) {
        console.log("No session found, performing local cleanup only");

        // 📊 ANALYTICS: track local-only logout
        analytics.trackEvent("logout_local_cleanup_only", {
          buttonLocation: "general",
          reason: "no_session",
          sessionStatus: sessionStatus,
        });

        // Perform local cleanup without calling Keycloak
        await handleUserSignOut(undefined, true); // skipKeycloakLogout = true
      } else {
        console.log("Session found or loading, performing normal logout");
        // Normal logout - let NextAuth and Keycloak handle session validation
        await handleUserSignOut(undefined, false); // skipKeycloakLogout = false
      }
    } catch (error) {
      console.warn("Logout error handled:", error);

      // 📊 ANALYTICS: track logout error
      analytics.trackEvent("logout_button_error", {
        buttonLocation: "general",
        error: error instanceof Error ? error.message : String(error),
        sessionStatus: sessionStatus,
      });

      // Fallback: try local cleanup
      try {
        await handleUserSignOut(undefined, true);
      } catch (fallbackError) {
        console.error("Fallback logout also failed:", fallbackError);
        // Force redirect as last resort
        window.location.href = "/";
      }
    } finally {
      setIsButtonLoading(false);
    }
  }, [session, sessionStatus]);

  return (
    <button
      type="button"
      className={`bg-theme btn btn-sm transform gap-2 border-0 border-none px-4 opacity-100 shadow-lg transition-all duration-300 ease-in-out hover:scale-[0.98] hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait disabled:brightness-95 ${className}`}
      onClick={handleLogout}
      disabled={isButtonLoading}
      id="btnSignOut"
      tabIndex={tabIndex}
      title="Log out"
    >
      {isButtonLoading && (
        <LoadingInline
          classNameSpinner="border-white h-6 w-6"
          classNameLabel="hidden"
        />
      )}
      {!isButtonLoading && <IoMdLogOut className="h-6 w-6 text-white" />}
      <p className="text-white">Logout</p>
    </button>
  );
};
