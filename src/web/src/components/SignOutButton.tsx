import React, { useCallback, useState } from "react";
import { IoMdLogOut } from "react-icons/io";
import { handleUserSignOut } from "~/lib/authUtils";
import { LoadingInline } from "./Status/LoadingInline";

export const SignOutButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleLogout = useCallback(() => {
    setIsButtonLoading(true);

    // signout from keycloak
    handleUserSignOut();
  }, [setIsButtonLoading]);

  return (
    <button
      type="button"
      className={`bg-theme btn btn-sm gap-2 border-0 border-none px-4 shadow-lg transition animate-in animate-out hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait disabled:brightness-95 ${className}`}
      onClick={handleLogout}
      disabled={isButtonLoading}
      id="btnSignOut"
    >
      {isButtonLoading && (
        <LoadingInline
          classNameSpinner="border-white h-6 w-6"
          classNameLabel="hidden"
        />
      )}
      {!isButtonLoading && <IoMdLogOut className="h-6 w-6 text-white" />}
      <p className="text-white">Sign Out</p>
    </button>
  );
};
