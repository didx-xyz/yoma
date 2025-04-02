import Moment from "react-moment";
import Link from "next/link";
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

  return (
    <div className="text-gray-dark shadow-custom rounded-lg bg-white p-4">
      <div className="mb-2 flex items-center">
        <input
          type="checkbox"
          className="checkbox-primary checkbox border-gray-dark mr-2 h-6 w-6"
          checked={selectedRows?.some((x) => x.id == item.id)}
          onChange={(e) => handleRowSelect(e, item)}
        />
        <h3 className="text-base font-semibold">{item.userDisplayName}</h3>
      </div>
      <div>
        <div className="mb-1 text-sm">
          <strong>Opportunity:</strong>{" "}
          <Link
            className="line-clamp-2"
            href={`/organisations/${id}/opportunities/${
              item.opportunityId
            }/info${`?returnUrl=${encodeURIComponent(
              getSafeUrl(returnUrl?.toString(), router.asPath),
            )}`}`}
          >
            {item.opportunityTitle}
          </Link>
        </div>
        <div className="mb-1 text-sm">
          <strong>Date connected:</strong>{" "}
          {item.dateModified && (
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {item.dateModified}
            </Moment>
          )}
        </div>
        <div className="flex flex-row items-center text-sm">
          <div className="mr-2 font-bold">Verified:</div>
          {item.verificationStatus && (
            <>
              {item.verificationStatus == "Pending" && (
                <button
                  type="button"
                  className="btn btn-sm border-gray text-gray-dark hover:bg-gray flex-nowrap bg-white hover:text-white"
                  onClick={() => {
                    onVerify(item);
                  }}
                >
                  <IoMdAlert className="text-yellow mr-2 inline-block h-6 w-6" />
                  Pending
                </button>
              )}
              {item.verificationStatus == "Completed" && (
                <div className="flex flex-row items-center gap-2">
                  <IoMdCheckmark className="text-green h-6 w-6" />
                  Completed
                </div>
              )}
              {item.verificationStatus == "Rejected" && (
                <div className="flex flex-row items-center gap-2">
                  <IoMdClose className="h-6 w-6 text-red-400" />
                  Rejected
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCard;
