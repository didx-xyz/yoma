import FileSaver from "file-saver";
import { useCallback, useState } from "react";
import { FaDownload } from "react-icons/fa";
import { IoMdClose, IoMdDownload, IoMdMail } from "react-icons/io";
import { toast } from "react-toastify";
import type { OpportunitySearchFilterAdmin } from "~/api/models/opportunity";
import { getOpportunitiesAdminExportToCSV } from "~/api/services/opportunities";
import { BTN_PRIMARY, BTN_SECONDARY } from "~/components/Common/buttonStyles";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalHeader,
} from "~/components/Common/ModalChrome";
import { PAGE_SIZE_MAXIMUM } from "~/lib/constants";

interface OpportunityExportDialogProps {
  totalCount: number;
  searchFilter: OpportunitySearchFilterAdmin;
  onClose: () => void;
  onSave?: () => void;
  className?: string;
}

const OpportunityExport: React.FC<OpportunityExportDialogProps> = ({
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
      const data = await getOpportunitiesAdminExportToCSV(downloadFilter);
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
      await getOpportunitiesAdminExportToCSV(emailFilter);

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
      <ModalHeader
        title="Export"
        icon={<FaDownload className="h-5 w-5" />}
        onClose={onClose}
      />

      <div className="flex flex-col items-center justify-center gap-4 px-4">
        {/* Description */}
        <FormMessage
          messageType={FormMessageType.Info}
          classNameLabel="!text-sm"
        >
          {(totalCount ?? 0) === 0 && (
            <>
              Your results are empty. Please try again with different filters.
            </>
          )}

          {totalCount > PAGE_SIZE_MAXIMUM && (
            <>
              Your results are quite large ({totalCount.toLocaleString()}{" "}
              total). You can download a maximum of{" "}
              {PAGE_SIZE_MAXIMUM.toLocaleString()} or you can choose to have all
              rows emailed to you.
            </>
          )}

          {totalCount > 0 && totalCount <= PAGE_SIZE_MAXIMUM && (
            <>
              You can download your results ({totalCount} total) or have them
              emailed to you. You will receive an email with a link to download.
            </>
          )}
        </FormMessage>

        {totalCount > 0 && (
          <>
            {/* Info message for large datasets */}
            {totalCount > PAGE_SIZE_MAXIMUM && (
              <FormMessage
                messageType={FormMessageType.Info}
                classNameLabel="!text-sm"
              >
                To help manage this, consider applying search filters like start
                date or end date. This will narrow down the size of your results
                and make your data more manageable.
              </FormMessage>
            )}

            <div className="border-gray w-full rounded-lg border-[1px] p-4">
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
                  className={`${BTN_PRIMARY} w-64`}
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
                <div className="border-gray grow border-t"></div>
                <div className="px-2 text-sm text-black">OR</div>
                <div className="border-gray grow border-t"></div>
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
                  className={`${BTN_PRIMARY} w-64`}
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
          </>
        )}

        {/* Cancel Button */}
        <ModalActions>
          <button
            type="button"
            className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
            onClick={() => {
              onClose();
              setIsLoadingDownload(false);
              setIsLoadingEmail(false);
            }}
          >
            <IoMdClose className="h-5 w-5" />
            Cancel
          </button>
        </ModalActions>
      </div>
    </div>
  );
};

export default OpportunityExport;
