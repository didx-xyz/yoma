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
      className="flex h-[260px] w-full cursor-pointer flex-col items-center gap-4 rounded-lg bg-white p-4 md:w-[320px]"
      href={href ?? "/"}
      onClick={onClick2}
      onAuxClick={onClick2}
    >
      <div className="flex flex-col">
        {/* header & image */}
        <div className="flex flex-grow flex-row items-start justify-start">
          <div className="flex flex-grow flex-row">
            <div className="flex flex-grow flex-col items-start justify-start">
              <p className="max-h-[35px] overflow-hidden text-ellipsis text-sm font-semibold text-gray-dark">
                {company}
              </p>
              <p className="max-h-[60px] overflow-hidden text-ellipsis text-lg font-bold">
                {name}
              </p>
            </div>

            <div className="flex flex-row">
              <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full shadow">
                <Image
                  src={imageURL}
                  alt={`${name} Logo`}
                  width={64}
                  height={64}
                  sizes="(max-width: 64px) 30vw, 50vw"
                  priority={true}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(64, 64),
                  )}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "64px",
                    maxHeight: "64px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* description */}
        <div className="my-2 h-[120px] overflow-hidden text-ellipsis text-start text-sm text-gray-dark">
          {summary}
        </div>

        {/* badges */}
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
