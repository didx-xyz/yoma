import Link from "next/link";
import {
  type OrganizationInfo,
  OrganizationStatus,
} from "~/api/models/organisation";
import {
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
  ROLE_ADMIN,
} from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import type { User } from "~/server/auth";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import type { AxiosError } from "axios";
import { useState, useCallback } from "react";
import { FaPencilAlt, FaClock, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { patchOrganisationStatus } from "~/api/services/organisations";
import { trackGAEvent } from "~/lib/google-analytics";
import { ApiErrors } from "../Status/ApiErrors";
import { useRouter } from "next/router";
import { Loading } from "../Status/Loading";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";

export const OrganisationCardComponent: React.FC<{
  key: string;
  item: OrganizationInfo;
  user: User;
  returnUrl?: string;
  onUpdateStatus: () => void;
}> = ({ key, item, user, returnUrl, onUpdateStatus }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const modalContext = useConfirmationModalContext();

  const _returnUrl = returnUrl
    ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
    : router.asPath;
  const isAdmin = user.roles.includes(ROLE_ADMIN);
  const link =
    item.status === "Active"
      ? `/organisations/${item.id}${_returnUrl}`
      : item.status === "Inactive" && isAdmin
        ? `/organisations/${item.id}/verify${_returnUrl}`
        : `/organisations/${item.id}/info${_returnUrl}`;

  const updateStatus = useCallback(
    async (status: OrganizationStatus) => {
      if (!item) return;

      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="text-gray-500 flex h-full flex-col space-y-2"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="h-6 w-6 text-warning" />
            <p className="text-lg">Confirm</p>
          </div>

          <div>
            <p className="text-sm leading-6">
              {status === OrganizationStatus.Deleted && (
                <>
                  Are you sure you want to delete this organisation?
                  <br />
                  This action cannot be undone.
                </>
              )}
              {status === OrganizationStatus.Active && (
                <>Are you sure you want to activate this organisation?</>
              )}
              {status === OrganizationStatus.Inactive && (
                <>Are you sure you want to inactivate this organisation?</>
              )}
            </p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        // call api
        await patchOrganisationStatus(item.id, {
          status: status,
          comment: "",
        });

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Organisation Status Changed to ${status} for Organisation ID: ${item.id}`,
        );

        toast.success("Organisation status updated");

        onUpdateStatus && onUpdateStatus();
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
      }
      setIsLoading(false);

      return;
    },
    [item, modalContext, setIsLoading, onUpdateStatus],
  );

  return (
    <div
      key={`orgCard_${key}`}
      className="flex flex-row rounded-xl bg-white shadow-custom transition duration-300 dark:bg-neutral-700 md:max-w-7xl"
    >
      {isLoading && <Loading />}

      <Link href={link} className="flex w-1/4 items-center justify-center p-2">
        <div className="flex h-28 w-28 items-center justify-center">
          <AvatarImage
            icon={item.logoURL ?? null}
            alt={item.name ?? null}
            size={60}
          />
        </div>
      </Link>

      <div className="relative flex w-3/4 flex-col justify-start p-2 pr-4">
        <Link
          href={link}
          className={`my-1 truncate overflow-ellipsis whitespace-nowrap font-medium ${
            item.status === "Inactive" ? "pr-20" : ""
          }`}
        >
          {item.name}
        </Link>
        <p className="h-[40px] overflow-hidden text-ellipsis text-sm">
          {item.tagline}
        </p>

        <div className="mt-2 flex flex-row">
          <div className="z-30 flex flex-grow flex-row items-center">
            {item.status == "Active" && (
              <>
                <span className="mr-2 h-2 w-2 rounded-full bg-success"></span>
                <div className="text-xs">{item.status}</div>
              </>
            )}
            {item.status == "Inactive" && (
              <>
                <span className="mr-2 h-2 w-2 rounded-full bg-warning"></span>
                <div className="text-xs">Pending</div>
              </>
            )}
            {item.status == "Deleted" && (
              <>
                <span className="mr-2 h-2 w-2 rounded-full bg-error"></span>
                <div className="text-xs">{item.status}</div>
              </>
            )}
          </div>

          <div className="dropdown dropdown-left -mr-0 w-10 md:-mr-4">
            <button
              className="bg-theme xl:hover:bg-theme !z-50 rounded-full p-1 text-xs text-white brightness-105 disabled:cursor-not-allowed disabled:bg-gray-dark xl:hover:brightness-110"
              disabled={item?.status == "Deleted"}
            >
              <IoIosSettings className="!z-50 h-7 w-7 md:h-5 md:w-5" />
            </button>

            <ul className="menu dropdown-content z-50 w-52 rounded-box bg-base-100 p-2 shadow">
              {item?.status != "Deleted" && (
                <li>
                  <Link
                    href={`/organisations/${item?.id}/edit${_returnUrl}`}
                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                  >
                    <FaPencilAlt className="mr-2 h-3 w-3" />
                    Edit
                  </Link>
                </li>
              )}

              {isAdmin && (
                <>
                  {item?.status == "Active" && (
                    <li>
                      <button
                        className="flex flex-row items-center text-gray-dark hover:brightness-50"
                        onClick={() =>
                          updateStatus(OrganizationStatus.Inactive)
                        }
                      >
                        <FaClock className="mr-2 h-3 w-3" />
                        Make Inactive
                      </button>
                    </li>
                  )}

                  {item?.status == "Inactive" && (
                    <li>
                      <button
                        className="flex flex-row items-center text-gray-dark hover:brightness-50"
                        onClick={() => updateStatus(OrganizationStatus.Active)}
                      >
                        <FaClock className="mr-2 h-3 w-3" />
                        Make Active
                      </button>
                    </li>
                  )}
                </>
              )}

              {item?.status != "Deleted" && (
                <li>
                  <button
                    className="flex flex-row items-center text-red-500 hover:brightness-50"
                    onClick={() => updateStatus(OrganizationStatus.Deleted)}
                  >
                    <FaTrash className="mr-2 h-3 w-3" />
                    Delete
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
