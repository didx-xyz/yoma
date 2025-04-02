import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import type { WalletVoucher } from "~/api/models/marketplace";
import { AvatarImage } from "../AvatarImage";
import Moment from "react-moment";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { IoMdAlert } from "react-icons/io";

const TransactionItemComponent: React.FC<{
  key: string;
  data: WalletVoucher;
  onClick: () => void;
}> = ({ key, data, onClick }) => {
  return (
    <button
      key={key}
      className="relative flex aspect-square h-64 w-full flex-col gap-1 rounded-lg bg-white p-5 shadow-xs sm:max-w-[300px]"
      onClick={onClick}
    >
      <div className="flex flex-row">
        <div className="flex flex-row">
          <div className="flex w-3/5 grow flex-col">
            <h2 className="line-clamp-3 h-[70px] max-w-[210px] overflow-hidden text-start text-[18px] leading-tight font-semibold text-ellipsis">
              {data.name}
            </h2>
          </div>
          <div className="absolute top-3 right-4">
            <AvatarImage icon={iconZlto} alt="Zlto Icon" size={50} />
          </div>
        </div>
      </div>
      <div className="flex max-w-[280px] grow flex-row">
        <p
          className="text-[rgba(84, 88, 89, 1)] line-clamp-4 text-start text-sm font-light"
          dangerouslySetInnerHTML={{ __html: data.instructions }}
        ></p>
      </div>

      {/* DATES */}
      <div className="text-gray-dark flex flex-col text-sm">
        <div>
          {data.dateStamp && (
            <>
              <span className="mr-2 font-bold">Date:</span>
              <span className="text-xs tracking-widest text-black">
                <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                  {data.dateStamp}
                </Moment>
              </span>
            </>
          )}
        </div>
      </div>

      {/* BADGES */}
      <div className="bottom-5x text-green-dark flex flex-row gap-1 pt-2 whitespace-nowrap">
        {data?.status == "New" && (
          <div className="badge bg-green-light text-green">
            <IoMdAlert className="mr-1" />
            New
          </div>
        )}

        {data.amount && (
          <div className="badge bg-[#FEF4D9] text-[#F6B700]">
            <Image
              src={iconZlto}
              alt="Icon Zlto"
              width={16}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
            <span className="ml-1">{Math.ceil(data?.amount)}</span>
          </div>
        )}
      </div>
    </button>
  );
};

export { TransactionItemComponent };
