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
      <div className="flex flex-col">
        {(() => {
          switch (error.response?.status) {
            case 401:
              return (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                    Access Denied
                  </div>
                  <p className="text-sm">
                    Your session has expired. Please sign-in and try again.
                  </p>
                </div>
              );
            case 403:
              return (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                    Access Denied
                  </div>
                  <p className="text-sm">
                    You don&apos;t have access to perform this action. Please
                    contact us to request access.
                  </p>
                </div>
              );
            case 500:
              return (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                    Error
                  </div>
                  <p className="text-sm">
                    An unknown error has occurred. Please contact us or try
                    again later. ☹️
                  </p>
                </div>
              );
            default:
              if (customErrors?.length === 0) {
                return (
                  <div className="flex flex-col">
                    <div className="flex flex-row items-center text-sm font-bold">
                      <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                      Error
                    </div>
                    <p className="text-sm">
                      An unknown error has occurred. Please contact us or try
                      again later. ☹️
                    </p>
                  </div>
                );
              }
              if (customErrors?.length === 1) {
                return (
                  <div className="flex flex-row items-center text-sm font-bold">
                    <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                    {customErrors[0]?.message}
                  </div>
                );
              }
              if (customErrors?.length > 1) {
                return (
                  <div className="flex flex-col">
                    <div className="flex flex-row items-center text-sm font-bold">
                      <IoMdFlame className="max-w-8 mr-2 h-full max-h-8 w-full text-xl text-white" />
                      The following errors occurred:
                    </div>
                    <ul className="list-disc">
                      {customErrors?.map((error) => (
                        <li key={error.message} className="truncate text-sm">
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
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
      <div className="flex flex-row items-center text-sm font-bold">
        <IoMdFlame className="mr-2 text-xl text-white" />
        {axiosErrors.message}
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center text-sm font-bold">
      <IoMdFlame className="mr-2 text-xl text-white" />
      Unknown error: {JSON.stringify(error)}
    </div>
  );
};
/* eslint-enable */
