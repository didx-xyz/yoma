import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconZlto from "public/images/icon-zlto.svg";
import Link from "next/link";
import { useCallback } from "react";
import { type StoreItemCategory } from "~/api/models/marketplace";
import { IoMdLock } from "react-icons/io";

interface InputProps {
  id: string;
  item: StoreItemCategory;
  company: string | undefined;
  href?: string;
  onClick?: () => void;
}

const ItemCardComponent: React.FC<InputProps> = ({
  id,
  item,
  company,
  href,
  onClick,
}) => {
  const onClick2 = useCallback(
    (e: React.SyntheticEvent) => {
      if (!onClick) return;
      e.preventDefault();
      onClick();
    },
    [onClick],
  );

  return (
    <Link
      key={id}
      className="m-2 flex h-56 w-64 flex-col gap-2 rounded-lg bg-white px-2 py-4 text-xs shadow"
      href={href ?? "/"}
      onClick={onClick2}
      onAuxClick={onClick2}
    >
      <div className="flex w-full flex-col items-start justify-start gap-2 md:scale-100">
        {/* HEADER & IMAGE */}
        <div className="flex w-full grow flex-row items-start justify-between">
          <div className="flex flex-col items-start justify-start gap-1">
            <p className="text-gray-dark mr-1 max-w-[170px] truncate text-xs font-medium md:max-w-[250px]">
              {company}
            </p>
            <p className="line-clamp-2 flex h-10 max-w-[170px] truncate text-sm font-semibold whitespace-break-spaces">
              {item.name}
            </p>
          </div>

          {item.imageURL && (
            <div className="flex flex-row items-center">
              <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full shadow">
                <Image
                  src={item.imageURL}
                  alt={`${item.name} Logo`}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  sizes="100vw"
                  priority={true}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(48, 48),
                  )}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        <div
          className="line-clamp-5 h-[100px] max-w-[200px] text-start text-sm font-light md:max-w-full"
          dangerouslySetInnerHTML={{ __html: item.description }}
        ></div>

        {/* BADGES */}
        <div className="flex flex-row items-center justify-start gap-2">
          {(item.amount ?? 0) > 0 && (
            <div className="flex">
              <div className="badge bg-yellow-light text-yellow h-6 rounded-md whitespace-nowrap">
                <Image
                  src={iconZlto}
                  alt="Icon Zlto"
                  width={16}
                  className="h-auto"
                  sizes="100vw"
                  priority={true}
                />
                <span className="ml-1 text-xs">{item.amount}</span>
              </div>
            </div>
          )}
          <div className="badge bg-gray text-gray-dark h-6 rounded-md whitespace-nowrap">
            <span className="ml-1 text-xs">{item.count ?? 0} left</span>
          </div>
        </div>

        {/* LOCKED/UNLOCKED */}
        {item.storeAccessControlRuleResult?.locked && (
          <div className="bg-gray-light absolute right-0 bottom-0 flex flex-col items-center justify-start gap-2 rounded-md px-2 py-1">
            <IoMdLock className="text-orange" />
            <p className="text-red text-xs font-semibold tracking-wide">
              Locked
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export { ItemCardComponent };
