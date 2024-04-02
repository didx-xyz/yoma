import Moment from "react-moment";
import Link from "next/link";
import { IoMdAlert, IoMdCheckmark, IoMdClose } from "react-icons/io";
import { type MyOpportunityInfo } from "~/api/models/myOpportunity";

interface MobileCardProps {
  item: MyOpportunityInfo;
  handleRowSelect: (
    event: React.ChangeEvent<HTMLInputElement>,
    item: any,
  ) => void;
  selectedRows: MyOpportunityInfo[] | undefined;
  returnUrl: string | string[] | undefined;
  id: string;
  setCurrentRow: (item: any) => void;
  setVerifyComments: (value: string) => void;
  setModalVerifySingleVisible: (value: boolean) => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
  item,
  handleRowSelect,
  selectedRows,
  returnUrl,
  id,
  setCurrentRow,
  setVerifyComments,
  setModalVerifySingleVisible,
}) => {
  return (
    <div className="rounded-lg bg-white p-4 text-gray-dark shadow-custom">
      <div className="mb-2 flex items-center">
        <input
          type="checkbox"
          className="checkbox-primary checkbox mr-2 h-6 w-6 border-gray-dark"
          checked={selectedRows?.some((x) => x.id == item.id)}
          onChange={(e) => handleRowSelect(e, item)}
        />
        <h3 className="text-base font-semibold">{item.userDisplayName}</h3>
      </div>
      <div>
        <p className="mb-1 text-sm">
          <strong>Opportunity:</strong>{" "}
          <Link
            className="line-clamp-2"
            href={`/organisations/${id}/opportunities/${
              item.opportunityId
            }/info${returnUrl ? `?returnUrl=${returnUrl}` : ""}`}
          >
            {item.opportunityTitle}
          </Link>
        </p>
        <p className="mb-1 text-sm">
          <strong>Date connected:</strong>{" "}
          {item.dateStart && (
            <Moment format="DD MMM YYYY HH:mm" utc={true}>
              {item.dateStart}
            </Moment>
          )}
        </p>
        <p className="text-sm">
          <strong>Verified:</strong>{" "}
          {item.verificationStatus && (
            <span>
              {item.verificationStatus == "Pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRow(item);
                    setVerifyComments("");
                    setModalVerifySingleVisible(true);
                  }}
                >
                  <IoMdAlert className="-mt-1 inline-block h-6 w-6 text-yellow" />
                </button>
              )}
              {item.verificationStatus == "Completed" && (
                <IoMdCheckmark className="-mt-1 inline-block h-6 w-6 text-green" />
              )}
              {item.verificationStatus == "Rejected" && (
                <IoMdClose className="text-red -mt-1 inline-block h-6 w-6" />
              )}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MobileCard;
