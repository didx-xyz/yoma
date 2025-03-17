import FileSaver from "file-saver";
import { useCallback, useState } from "react";
import { FaDownload } from "react-icons/fa";
import { IoMdClose, IoMdDownload, IoMdMail } from "react-icons/io";
import { toast } from "react-toastify";
import type { MyOpportunitySearchFilterAdmin } from "~/api/models/myOpportunity";
import { getMyOpportunitiesExportToCSV } from "~/api/services/myOpportunities";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { PAGE_SIZE_MAXIMUM } from "~/lib/constants";

interface VerificationExportDialogProps {
  totalCount: number;
  searchFilter: MyOpportunitySearchFilterAdmin;
  onClose: () => void;
  onSave?: () => void;
  className?: string;
}

const VerificationExport: React.FC<VerificationExportDialogProps> = ({
  totalCount,
  searchFilter,
  onClose,
  onSave,
  className = "",
}) => {
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  const handleDownload = useCallback(async () => {
    try {
      setIsLoadingDownload(true);

      // Prepare filter with pagination for direct download
      const downloadFilter = { ...searchFilter };
      downloadFilter.pageNumber = 1;
      downloadFilter.pageSize = PAGE_SIZE_MAXIMUM;

      // Call API and download file
      const data = await getMyOpportunitiesExportToCSV(downloadFilter);
      if (data) FileSaver.saveAs(data);

      // Call onSave callback if provided
      if (onSave) onSave();

      // Close dialog
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Download failed. Please try again later.", {
        autoClose: false,
      });
    } finally {
      setIsLoadingDownload(false);
    }
  }, [searchFilter, onClose, onSave]);

  const handleEmail = useCallback(async () => {
    try {
      setIsLoadingEmail(true);

      // Prepare filter without pagination for email request
      const emailFilter = { ...searchFilter };
      emailFilter.pageNumber = null;
      emailFilter.pageSize = null;

      // Call API to request email
      await getMyOpportunitiesExportToCSV(emailFilter);

      // Show success message
      toast.success(
        "Your request has been submitted. You will receive an email shortly.",
        { autoClose: 10000 },
      );

      // Call onSave callback if provided
      if (onSave) onSave();

      // Close dialog
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Request failed. Please try again later.", {
        autoClose: false,
      });
    } finally {
      setIsLoadingEmail(false);
    }
  }, [searchFilter, onClose, onSave]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="bg-theme flex flex-row p-4 shadow-lg">
        <h1 className="flex-grow"></h1>
        <button
          type="button"
          className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
          onClick={onClose}
        >
          <IoMdClose className="h-6 w-6"></IoMdClose>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        {/* Icon */}
        <div className="-mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
          <FaDownload className="h-8 w-8 text-yellow" />
        </div>

        <div
          className="w-full items-center justify-center"
          style={{ animationDelay: "0.4s" }}
        >
          {/* Title & Description */}
          <div className="mb-4 flex flex-col items-center gap-1 text-center">
            <h3>Export Submissions</h3>

            <div className="max-w-md tracking-wide text-gray-dark">
              {(totalCount ?? 0) === 0 && (
                <>
                  Your results are empty. Please try again with different
                  filters.
                </>
              )}

              {totalCount > PAGE_SIZE_MAXIMUM && (
                <>
                  Your results are quite large ({totalCount.toLocaleString()}{" "}
                  total). You can download a maximum of{" "}
                  {PAGE_SIZE_MAXIMUM.toLocaleString()} or you can choose to have
                  all rows emailed to you.
                </>
              )}

              {totalCount > 0 && totalCount <= PAGE_SIZE_MAXIMUM && (
                <>
                  You can download your results ({totalCount} total) or have
                  them emailed to you. You will receive an email with a link to
                  download.
                </>
              )}
            </div>
          </div>

          {totalCount > 0 && (
            <div className="mx-4 flex flex-col gap-4 py-4">
              {/* Info message for large datasets */}
              {totalCount > PAGE_SIZE_MAXIMUM && (
                <FormMessage
                  messageType={FormMessageType.Info}
                  classNameLabel="!text-sm"
                >
                  To help manage this, consider applying search filters like
                  start date or end date. This will narrow down the size of your
                  results and make your data more manageable.
                </FormMessage>
              )}

              <div className="rounded-lg border-[1px] border-gray p-4">
                {/* Download Button */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="font-sm font-semibold">
                    {totalCount > PAGE_SIZE_MAXIMUM ? (
                      <>When you&apos;re ready, click to download:</>
                    ) : (
                      <>Click to download your results:</>
                    )}
                  </div>

                  <button
                    type="button"
                    className="bg-theme btn w-64 normal-case text-white hover:brightness-110 disabled:border-0 disabled:brightness-90"
                    onClick={handleDownload}
                    disabled={isLoadingDownload || isLoadingEmail}
                  >
                    {isLoadingDownload ? (
                      <p className="text-white">Downloading...</p>
                    ) : (
                      <>
                        <IoMdDownload className="h-5 w-5 text-white" />
                        <p className="text-white">
                          Download{" "}
                          {totalCount > PAGE_SIZE_MAXIMUM && (
                            <>({PAGE_SIZE_MAXIMUM.toLocaleString()} max)</>
                          )}
                        </p>
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="my-4 flex w-full items-center">
                  <div className="flex-grow border-t border-gray"></div>
                  <div className="px-2 text-sm text-black">OR</div>
                  <div className="flex-grow border-t border-gray"></div>
                </div>

                {/* Email Button */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="font-sm font-semibold">
                    {totalCount > PAGE_SIZE_MAXIMUM ? (
                      <>Need all the rows? Get them emailed to you:</>
                    ) : (
                      <>Get them emailed to you:</>
                    )}
                  </div>

                  <button
                    type="button"
                    className="bg-theme btn w-64 normal-case text-white hover:brightness-110 disabled:border-0 disabled:brightness-90"
                    onClick={handleEmail}
                    disabled={isLoadingDownload || isLoadingEmail}
                  >
                    {isLoadingEmail ? (
                      <p className="text-white">Submitting...</p>
                    ) : (
                      <>
                        <IoMdMail className="h-5 w-5 text-white" />
                        <p className="text-white">
                          Email{" "}
                          {totalCount > PAGE_SIZE_MAXIMUM && (
                            <>({totalCount.toLocaleString()} total)</>
                          )}
                        </p>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <div className="my-4 flex w-full flex-grow items-center justify-center gap-4">
            <button
              type="button"
              className="btn btn-outline w-64 flex-shrink rounded-full border-green bg-white normal-case text-green hover:border-0 hover:bg-green hover:text-white"
              onClick={() => {
                onClose();
                setIsLoadingDownload(false);
                setIsLoadingEmail(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationExport;
