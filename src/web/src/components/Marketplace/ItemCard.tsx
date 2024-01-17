import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconZlto from "public/images/icon-zlto.svg";
import Link from "next/link";
import { useCallback } from "react";

interface InputProps {
  [key: string]: any;
  imageURL: string;
  company: string;
  name: string;
  summary: string;
  amount: number | null;
  href?: string;
  onClick?: () => void;
}

const ItemCardComponent: React.FC<InputProps> = ({
  key,
  imageURL,
  company,
  name,
  summary,
  amount,
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
      key={key}
      className="relative flex aspect-square h-56 w-full transform-gpu flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-lg transition-transform hover:scale-105 md:w-[340px]"
      href={href ?? "/"}
      onClick={onClick2}
      onAuxClick={onClick2}
    >
      <div className="flex flex-col gap-2">
        {/* HEADER & IMAGE */}
        <div className="flex flex-grow flex-row justify-center">
          <div className="h-16x flex flex-grow flex-col items-start justify-start gap-1">
            <p className="h-6x w-64 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-dark">
              {company}
            </p>
            <p className="h-14x w-64 overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-semibold">
              {name}
            </p>
          </div>

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
        </div>

        {/* DESCRIPTION */}
        <div className="my-2x h-[100px] overflow-hidden text-start text-sm text-gray-dark">
          {summary}
        </div>

        {/* BADGES */}
        <div className="flex flex-row items-center justify-start gap-2">
          {(amount ?? 0) > 0 && (
            <div className="badge h-6 whitespace-nowrap rounded-md bg-yellow-light text-yellow">
              <Image
                src={iconZlto}
                alt="Icon Zlto"
                width={18}
                height={18}
                sizes="100vw"
                priority={true}
                style={{ width: "18px", height: "18px" }}
              />
              <span className="ml-1 text-xs">{amount}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export { ItemCardComponent };
