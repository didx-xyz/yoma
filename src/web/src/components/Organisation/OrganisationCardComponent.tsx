import Link from "next/link";
import {
  OrganizationInfo,
  OrganizationStatus,
} from "~/api/models/organisation";
import {
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
  ROLE_ADMIN,
} from "~/lib/constants";
import { AvatarImage } from "../AvatarImage";
import { User } from "~/server/auth";
import { IoIosSettings, IoMdOptions } from "react-icons/io";
import { AxiosError } from "axios";
import { useState, useCallback } from "react";
import { FaPencilAlt, FaClock, FaTrash } from "react-icons/fa";
import ReactModal from "react-modal";
import { toast } from "react-toastify";
import { patchOrganisationStatus } from "~/api/services/organisations";
import { trackGAEvent } from "~/lib/google-analytics";
import { ApiErrors } from "../Status/ApiErrors";

export const OrganisationCardComponent: React.FC<{
  key: string;
  item: OrganizationInfo;
  user: User;
  returnUrl?: string;
  onUpdateStatus: () => void;
}> = ({ key, item, user, returnUrl, onUpdateStatus }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [manageOpportunityMenuVisible, setManageOpportunityMenuVisible] =
    useState(false);
  const link = user.roles.includes(ROLE_ADMIN)
    ? item.status === "Active"
      ? `/organisations/${item.id}/info`
      : `/organisations/${item.id}/verify`
    : item.status === "Active"
      ? `/organisations/${item.id}`
      : `/organisations/${item.id}/edit`;

  const updateStatus = useCallback(
    async (status: OrganizationStatus) => {
      if (!item) return;
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

        // invalidate cache
        // await queryClient.invalidateQueries({
        //   queryKey: ["Organisations", query, page, status],
        // });

        toast.success("Organisation status updated");

        onUpdateStatus && onUpdateStatus();
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
    [item, setIsLoading],
  );

  return (
    <div
      key={`orgCard_${key}`}
      //className="flex flex-row rounded-xl bg-white shadow-custom transition duration-300 hover:scale-[1.01] dark:bg-neutral-700 md:max-w-7xl"
      className="flex flex-row rounded-xl bg-white shadow-custom transition duration-300 dark:bg-neutral-700 md:max-w-7xl"
    >
      <div className="flex w-1/4 items-center justify-center p-2">
        <div className="flex h-28 w-28 items-center justify-center">
          <AvatarImage
            icon={item.logoURL ?? null}
            alt={item.name ?? null}
            size={60}
          />
        </div>
      </div>

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
          <div className="flex flex-grow flex-row items-center">
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

          <div className="dropdown dropdown-left w-10">
            {/* <button
              role="button"
              className="btn btn-square p-1"
              // onClick={() => {
              //   setManageOpportunityMenuVisible(true);
              // }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button> */}
            <button
              className="bg-theme hover:bg-theme w-40x flex flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-dark"
              // onClick={() => {
              //   setManageOpportunityMenuVisible(true);
              // }}
              //disabled={currentOrganisationInactive}
            >
              <IoIosSettings className="mr-1x h-5 w-5" />
            </button>

            <ul className="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
              {/* <li>
              <a>Item 1</a>
            </li>
            <li>
              <a>Item 2</a>
            </li> */}

              {item?.status != "Deleted" && (
                <li>
                  <Link
                    href={`/organisations/${item?.id}/edit${
                      returnUrl
                        ? `?returnUrl=${encodeURIComponent(
                            returnUrl.toString(),
                          )}`
                        : ""
                    }`}
                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                  >
                    <FaPencilAlt className="mr-2 h-3 w-3" />
                    Edit
                  </Link>
                </li>
              )}
              {/* TODO */}
              {/* <Link
                href={`/organisations/${id}/opportunities/${opportunityId}/edit`}
                className="flex flex-row items-center text-gray-dark hover:brightness-50"
              >
                <FaClipboard className="mr-2 h-3 w-3" />
                Duplicate
              </Link> */}

              {/* if active, then org admins can make it inactive
                  if deleted, admins can make it inactive */}
              {item?.status == "Active" && (
                <li>
                  <button
                    className="flex flex-row items-center text-gray-dark hover:brightness-50"
                    onClick={() => updateStatus(OrganizationStatus.Inactive)}
                  >
                    <FaClock className="mr-2 h-3 w-3" />
                    Make Inactive
                  </button>
                </li>
              )}

              {(item?.status == "Inactive" ||
                (user?.roles.some((x) => x === "Admin") &&
                  item?.status == "Deleted")) && (
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

              {/* <div className="divider -m-2" /> */}
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
