import Link from "next/link";
import {
  type OrganizationInfo,
  OrganizationStatus,
} from "~/api/models/organisation";
import { ROLE_ADMIN } from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import type { User } from "~/server/auth";
import { IoIosSettings, IoMdWarning } from "react-icons/io";
import type { AxiosError } from "axios";
import { useState, useCallback } from "react";
import { FaPencilAlt, FaClock, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { patchOrganisationStatus } from "~/api/services/organisations";
import analytics from "~/lib/analytics";
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
    ? `returnUrl=${encodeURIComponent(returnUrl.toString())}`
    : router.asPath;
  const isAdmin = user.roles.includes(ROLE_ADMIN);
  const link =
    item.status === "Active"
      ? `/organisations/dashboard?organisations=${item.id}&${_returnUrl}`
      : item.status === "Inactive" && isAdmin
        ? `/organisations/${item.id}/verify?${_returnUrl}`
        : `/organisations/${item.id}/info?${_returnUrl}`;

  const updateStatus = useCallback(
    async (status: OrganizationStatus) => {
      if (!item) return;

      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2 text-gray-500"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
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

        // 📊 ANALYTICS: track organisation status update
        analytics.trackEvent("organisation_status_updated", {
          organisationId: item.id,
          organisationName: item.name,
          newStatus: status,
        });

        toast.success("Organisation status updated");

        if (onUpdateStatus) {
          onUpdateStatus();
        }
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
        //captureException(error);
      }
      setIsLoading(false);

      return;
    },
    [item, modalContext, setIsLoading, onUpdateStatus],
  );

  return (
    <div
      key={`orgCard_${key}`}
      className="shadow-custom flex flex-row rounded-xl bg-white transition duration-300"
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
          className={`my-1 truncate font-medium text-ellipsis whitespace-nowrap ${
            item.status === "Inactive" ? "pr-20" : ""
          }`}
        >
          {item.name}
        </Link>
        <p className="h-[40px] overflow-hidden text-sm text-ellipsis">
          {item.tagline}
        </p>

        <div className="mt-2 flex flex-row">
          <div className="z-30 flex grow flex-row items-center">
            {item.status == "Active" && (
              <>
                <span className="bg-success mr-2 h-2 w-2 rounded-full"></span>
                <div className="text-xs">{item.status}</div>
              </>
            )}
            {item.status == "Inactive" && (
              <>
                <span className="bg-warning mr-2 h-2 w-2 rounded-full"></span>
                <div className="text-xs">Pending</div>
              </>
            )}
            {item.status == "Deleted" && (
              <>
                <span className="bg-error mr-2 h-2 w-2 rounded-full"></span>
                <div className="text-xs">{item.status}</div>
              </>
            )}
            {item.status == "Declined" && (
              <>
                <span className="bg-error mr-2 h-2 w-2 rounded-full"></span>
                <div className="text-xs">{item.status}</div>
              </>
            )}
          </div>

          {item?.status != "Deleted" && (
            <div className="dropdown dropdown-end dropdown-left">
              <div
                role="button"
                aria-label="Settings"
                tabIndex={0}
                className="bg-theme rounded-full p-1 text-white"
              >
                <IoIosSettings className="h-7 w-7 md:h-5 md:w-5" />
              </div>

              <ul className="menu dropdown-content rounded-box bg-base-100 z-50 w-52 p-2 shadow">
                {item?.status != "Deleted" && (
                  <li>
                    <Link
                      href={`/organisations/${item?.id}/edit?${_returnUrl}`}
                      className="text-gray-dark flex flex-row items-center hover:brightness-50"
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
                          className="text-gray-dark flex flex-row items-center hover:brightness-50"
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
                          className="text-gray-dark flex flex-row items-center hover:brightness-50"
                          onClick={() =>
                            updateStatus(OrganizationStatus.Active)
                          }
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
          )}
        </div>
      </div>
    </div>
  );
};
