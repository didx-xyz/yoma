import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconZlto from "public/images/icon-zlto.svg";
import Link from "next/link";

interface InputProps {
  [key: string]: any;
  imageURLs: string[];
  name: string;
  href: string;
}

const CategoryCardComponent: React.FC<InputProps> = ({
  key,
  imageURLs,
  name,
  href,
}) => {
  return (
    <Link
      key={key}
      className="flex h-[140px] w-full cursor-pointer flex-col items-center gap-4 rounded-lg bg-white p-4 md:w-[240px]"
      href={href}
    >
      <div className="flex flex-row">
        <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full shadow">
          {imageURLs &&
            imageURLs.length > 0 &&
            imageURLs.map((url, index) => (
              <Image
                key={`${key}_${index}`}
                src={url}
                alt={`Store Category ${index}`}
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
            ))}
          {!imageURLs ||
            (imageURLs.length === 0 && (
              <Image
                src={iconZlto}
                alt={`Store Category ${name}`}
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
            ))}
        </div>
      </div>
      <div className="flex flex-grow flex-row justify-center">
        <p className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-black">
          {name}
        </p>
      </div>
    </Link>
  );
};

export { CategoryCardComponent };
