import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconZlto from "public/images/icon-zlto.svg";
import Link from "next/link";
import { useCallback } from "react";

interface InputProps {
  id: string;
  imageURL: string | null;
  company: string;
  name: string;
  summary: string;
  amount: number | null;
  count?: number;
  href?: string;
  onClick?: () => void;
}

const ItemCardComponent: React.FC<InputProps> = ({
  id,
  imageURL,
  company,
  name,
  summary,
  amount,
  count,
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
      className="relative ml-1 flex aspect-square h-56 w-full flex-col flex-wrap items-start justify-start gap-4 overflow-hidden rounded-lg bg-white p-4 shadow-sm md:ml-0 md:w-[340px]"
      href={href ?? "/"}
      onClick={onClick2}
      onAuxClick={onClick2}
    >
      <div className="flex w-full flex-col items-start justify-start gap-2 md:scale-100">
        {/* HEADER & IMAGE */}
        <div className="flex w-full flex-grow flex-row items-start justify-between">
          <div className="h-16x flex flex-col items-start justify-start gap-1">
            <p className="h-6x mr-1 max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-dark md:max-w-[250px]">
              {company}
            </p>
            <p className="h-14x mr-1 max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-semibold md:max-w-[250px]">
              {name}
            </p>
          </div>

          {imageURL && (
            <div className="flex flex-row items-center">
              <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full shadow">
                <Image
                  src={imageURL}
                  alt={`${name} Logo`}
                  width={48}
                  height={48}
                  sizes="(max-width: 48px) 30vw, 50vw"
                  priority={true}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(48, 48),
                  )}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "48px",
                    maxHeight: "48px",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="my-2x h-[100px] max-w-[200px] overflow-hidden text-start text-sm font-light md:max-w-full">
          {summary}
        </div>

        {/* BADGES */}
        <div className="flex flex-row items-center justify-start gap-2">
          {(amount ?? 0) > 0 && (
            <div className="flex">
              <div className="badge h-6 whitespace-nowrap rounded-md bg-yellow-light text-yellow">
                <Image
                  src={iconZlto}
                  alt="Icon Zlto"
                  width={16}
                  height={16}
                  sizes="100vw"
                  priority={true}
                  style={{ width: "16px", height: "16px" }}
                />
                <span className="ml-1 text-xs">{amount}</span>
              </div>{" "}
            </div>
          )}
          <div className="badge h-6 whitespace-nowrap rounded-md bg-gray text-gray-dark">
            <span className="ml-1 text-xs">{count ?? 0} left</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export { ItemCardComponent };
