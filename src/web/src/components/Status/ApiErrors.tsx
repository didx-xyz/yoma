/* eslint-disable */
import { type AxiosError } from "axios";
import { type ReactElement } from "react";
import { IoMdFlame } from "react-icons/io";
import { type ErrorResponseItem } from "~/api/models/common";

export type Props = ({ error }: { error: any }) => ReactElement;

export const ApiErrors: Props = ({ error }) => {
  const customErrors = error.response?.data as ErrorResponseItem[];

  if (error.response?.status) {
    return (
      <div className="px-4">
        {(() => {
          switch (error.response?.status) {
            case 401:
              return (
                <>
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />
                    Access Denied
                  </div>
                  <p className="text-sm">
                    Your session has expired. Please sign-in and try again.
                  </p>
                </>
              );
            case 403:
              return (
                <>
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />
                    Access Denied
                  </div>
                  <p className="text-sm">
                    You don&apos;t have access to perform this action. Please
                    contact us to request access.
                  </p>
                </>
              );
            case 500:
              return (
                <>
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />{" "}
                    Access Denied
                  </div>
                  <p className="text-sm">
                    An unknown error has occurred. Please contact us or try
                    again later. ☹️
                  </p>
                </>
              );
            default:
              if (customErrors?.length === 0) {
                return (
                  <>
                    <div className="mb-4 flex flex-row items-center text-sm font-bold">
                      <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />{" "}
                      Error
                    </div>
                    <p className="text-sm">
                      An unknown error has occurred. Please contact us or try
                      again later. ☹️
                    </p>
                  </>
                );
              }
              if (customErrors?.length === 1) {
                return (
                  <div className="mb-4 flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />
                    {customErrors[0]?.message}
                  </div>
                );
              }
              if (customErrors?.length > 1) {
                return (
                  <>
                    <div className="mb-4 flex flex-row items-center text-sm font-bold">
                      <IoMdFlame className="mr-2 h-10 w-10 text-xl text-red-400" />{" "}
                      The following errors occurred:
                    </div>
                    <ul className="list-disc">
                      {customErrors?.map((error) => (
                        <li key={error.message} className="text-sm">
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </>
                );
              }
              return null;
          }
        })()}
      </div>
    );
  }

  const axiosErrors = error as AxiosError;
  if (axiosErrors?.isAxiosError) {
    return (
      <div className="mb-4 flex flex-row items-center text-sm font-bold">
        <IoMdFlame className="mr-2 text-xl text-red-400" />
        {axiosErrors.message}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-row items-center text-sm font-bold">
      <IoMdFlame className="mr-2 text-xl text-red-400" />
      Unknown error: {JSON.stringify(error)}
    </div>
  );
};
/* eslint-enable */
