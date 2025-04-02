import Image from "next/image";
import React from "react";
import { IoMdPerson } from "react-icons/io";

interface InputProps {
  icon?: any;
  alt: string;
  size: number;
}

export const AvatarImage: React.FC<InputProps> = ({ icon, alt, size = 40 }) => {
  const sizePixels: string = size + "px";

  return (
    <div
      className={`shadow-custom flex aspect-square shrink-0 overflow-hidden rounded-full bg-white/20`}
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
          className="h-auto"
          sizes="100vw"
          priority={true}
        />
      ) : (
        <IoMdPerson
          className={`text-gray p-2`}
          style={{
            width: sizePixels,
            height: sizePixels,
          }}
        />
      )}
    </div>
  );
};
