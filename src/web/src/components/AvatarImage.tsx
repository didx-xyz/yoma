import Image from "next/image";
import { shimmer, toBase64 } from "~/lib/image";
import { IoMdImage } from "react-icons/io";

interface InputProps {
  icon?: any;
  alt: string;
  size: number;
}

export const AvatarImage: React.FC<InputProps> = ({ icon, alt, size }) => {
  const sizePixels: string = size + "px";
  return (
    <div
      className={`flex aspect-square flex-shrink-0 overflow-hidden rounded-full bg-white bg-opacity-20 shadow-custom `}
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
        <IoMdImage
          className={`p-2 text-gray`}
          style={{
            width: sizePixels,
            height: sizePixels,
          }}
        />
      )}
    </div>
  );
};
