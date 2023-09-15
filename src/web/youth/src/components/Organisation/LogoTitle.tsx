import Image from "next/image";
import { IoMdImage } from "react-icons/io";

interface InputProps {
  logoUrl?: string | undefined | null;
  title?: string | undefined | null;
}

export const LogoTitle: React.FC<InputProps> = ({ logoUrl, title }) => {
  return (
    <div className="flex flex-row items-center">
      {/* LOGO */}
      <div className="flex h-20 min-w-max items-center justify-center">
        {/* NO IMAGE */}
        {!logoUrl && <IoMdImage className="text-gray-400 h-20 w-20" />}

        {/* EXISTING IMAGE */}
        {logoUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              className="m-4 rounded-lg"
              alt="company logo"
              width={60}
              height={60}
              src={logoUrl}
            />
          </>
        )}
      </div>

      {/* TITLE */}
      <h2 className="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
        {title}
      </h2>
    </div>
  );
};
