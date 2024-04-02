import Image from "next/image";
import { shimmer, toBase64 } from "~/lib/image";
import { IoMdPerson } from "react-icons/io";

interface InputProps {
  icon?: any;
  alt: string;
  size: number;
  sizeMobile?: number;
}

export const AvatarImage: React.FC<InputProps> = ({
  icon,
  alt,
  size,
  sizeMobile,
}) => {
  return (
    <div
      className={`flex aspect-square flex-shrink-0 overflow-hidden rounded-full bg-white bg-opacity-20 shadow-custom w-[${sizeMobile}px] h-[${sizeMobile}px] md:h-[${size}px] md:w-[${size}px]`}
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
          className={`w-[${sizeMobile}px] h-[${sizeMobile}px] md:w-[${size}px] md:h-[${size}px]`}
        />
      ) : (
        <IoMdPerson
          className={`p-4 text-gray w-[${sizeMobile}px] h-[${sizeMobile}px] md:w-[${size}px] md:h-[${size}px]`}
        />
      )}
    </div>
  );
};
