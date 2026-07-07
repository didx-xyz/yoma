import Moment from "react-moment";
import Link from "next/link";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdAlert, IoMdCheckmark, IoMdClose } from "react-icons/io";
import { type MyOpportunityInfo } from "~/api/models/myOpportunity";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { getSafeUrl } from "~/lib/utils";
import { useRouter } from "next/router";

interface MobileCardProps {
  item: MyOpportunityInfo;
  handleRowSelect: (
    event: React.ChangeEvent<HTMLInputElement>,
    item: any,
  ) => void;
  selectedRows: MyOpportunityInfo[] | undefined;
  returnUrl: string | string[] | undefined;
  id: string;
  onVerify: (item: any) => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
  item,
  handleRowSelect,
  selectedRows,
  returnUrl,
  id,
  onVerify,
}) => {
  const router = useRouter();
  const isPartnerManaged =
    item.syncedInfo?.syncType === "Pull" || item.syncedInfo?.locked === true;
  const partnerSourceLabel =
    item.syncedInfo?.partners?.map((partner) => partner.partner).join(", ") ||
    null;
  const detailsHref = `/organisations/${id}/opportunities/${item.opportunityId}/info?returnUrl=${encodeURIComponent(
    getSafeUrl(returnUrl?.toString(), router.asPath),
  )}`;

  return (
    <div className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4">
      <div className="border-gray-light flex flex-row gap-2 border-b-2 pb-2">
        <span title={item.opportunityTitle ?? undefined} className="w-full">
          <Link
            className="line-clamp-1 text-start font-semibold"
            href={detailsHref}
          >
            {item.opportunityTitle}
          </Link>
        </span>

        <input
          type="checkbox"
          className="checkbox checkbox-primary mt-0.5 shrink-0"
          checked={selectedRows?.some((x) => x.id == item.id)}
          disabled={isPartnerManaged}
          title={
            isPartnerManaged
              ? "Partner-managed submissions cannot be approved or declined manually"
              : undefined
          }
          onChange={(e) => handleRowSelect(e, item)}
        />
      </div>

      <div className="text-gray-dark flex flex-col gap-2">
        <div className="flex justify-between gap-4">
          <p className="text-sm tracking-wider">Student</p>
          <span className="text-right text-sm">{item.userDisplayName}</span>
        </div>

        <div className="flex justify-between gap-4">
          <p className="text-sm tracking-wider">Date connected</p>
          <div className="text-right text-sm">
            {item.dateModified && (
              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                {item.dateModified}
              </Moment>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <p className="text-sm tracking-wider">Status</p>
          <div className="flex justify-start gap-2 text-sm">
            {item.verificationStatus && (
              <>
                {item.verificationStatus == "Pending" && (
                  <div className="flex flex-col gap-2">
                    {!isPartnerManaged && (
                      <button
                        type="button"
                        className="btn border-gray text-gray-dark btn-sm hover:bg-gray flex-nowrap bg-white hover:text-white"
                        onClick={() => {
                          onVerify(item);
                        }}
                      >
                        <IoMdAlert className="text-yellow mr-2 inline-block h-6 w-6" />
                        Pending
                      </button>
                    )}

                    {isPartnerManaged &&
                      item.percentComplete !== null &&
                      item.percentComplete !== undefined && (
                        <div className="flex w-full max-w-[130px] flex-col gap-1 text-xs">
                          <span className="text-gray-dark text-right">
                            {item.percentComplete}% complete
                            <span title={`Managed by ${partnerSourceLabel}`}>
                              <IoInformationCircleOutline className="text-blue ml-1 inline-block size-5" />
                            </span>
                          </span>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="bg-green h-full rounded-full"
                              style={{
                                width: `${Math.min(Math.max(item.percentComplete ?? 0, 0), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {item.verificationStatus == "Completed" && (
                  <div title="Submission has been completed.">
                    <span className="badge bg-green-light text-green border-green/10 gap-1 border border-none text-[10px] font-semibold select-none">
                      <IoMdCheckmark className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  </div>
                )}
                {item.verificationStatus == "Rejected" && (
                  <div title="Submission was declined.">
                    <span className="badge gap-1 border border-none border-red-100 bg-red-50 text-[10px] font-semibold text-red-500 select-none">
                      <IoMdClose className="h-3.5 w-3.5" />
                      Declined
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileCard;
