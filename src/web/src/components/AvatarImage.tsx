import Image from "next/image";
import React from "react";
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
      className={`flex aspect-square flex-shrink-0 overflow-hidden rounded-full bg-white bg-opacity-20 shadow-custom `}
      style={{
        width: sizePixels,
        height: sizePixels,
      }}
    >
      {icon ? (
        <Image
          src={icon}
          alt={alt}
          width={size}
          height={size}
          sizes="100vw"
          priority={true}
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
