import Image from "next/image";
import { shimmer, toBase64 } from "~/lib/image";
import { IoMdPerson } from "react-icons/io";

interface InputProps {
  icon?: any;
  alt: string;
  size: number;
}

export const AvatarImage: React.FC<InputProps> = ({ icon, alt, size }) => {
  const sizePixels: string = size + "px";
  return (
    <div
      className={`flex aspect-square flex-shrink-0 overflow-hidden rounded-full bg-white shadow-custom `}
      style={{
        width: sizePixels,
        height: sizePixels,
      }}
    >
      {icon && icon ? (
        <Image
          src={icon}
          alt={alt}
          width={size}
          height={size}
          sizes="100vw"
          priority={true}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(
            shimmer(size, size),
          )}`}
          style={{
            width: sizePixels,
            height: sizePixels,
          }}
        />
      ) : (
        <IoMdPerson
          className={`p-3 text-gray`}
          style={{
            width: sizePixels,
            height: sizePixels,
          }}
        />
      )}
    </div>
  );
};
