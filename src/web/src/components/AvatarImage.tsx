import React, { useState } from "react";
import Image from "next/image";
import { shimmer, toBase64 } from "~/lib/image";
import { IoMdPerson } from "react-icons/io";

interface InputProps {
  icon?: any;
  alt: string;
  size: number;
}

export const AvatarImage: React.FC<InputProps> = ({ icon, alt, size }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const sizePixels: string = size + "px";

  return (
    <div
      className={`flex aspect-square flex-shrink-0 overflow-hidden rounded-full bg-white bg-opacity-20 shadow-custom `}
      style={{
        width: sizePixels,
        height: sizePixels,
      }}
    >
      {!imageLoaded && (
        <div
          className="bg-gray-200 absolute inset-0 flex items-center justify-center"
          style={{ width: sizePixels, height: sizePixels }}
        ></div>
      )}
      {icon ? (
        <Image
          src={icon}
          alt={alt}
          width={size}
          height={size}
          sizes="100vw"
          priority={true}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)} // Handle error case
          style={{
            width: sizePixels,
            height: sizePixels,
            display: imageLoaded ? "block" : "none", // Hide image until loaded
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
