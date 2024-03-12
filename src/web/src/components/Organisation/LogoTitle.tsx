import { IoMdImage } from "react-icons/io";
import { AvatarImage } from "../AvatarImage";

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
        {!logoUrl && <IoMdImage className="text-gray-400 h-10 w-10" />}

        {/* EXISTING IMAGE */}
        {logoUrl && (
          <div className="mr-4 h-fit">
            <AvatarImage alt="company logo" size={40} icon={logoUrl} />
          </div>
        )}
      </div>

      {/* TITLE */}
      <h3 className="text-ellipsis whitespace-nowrap font-bold text-white">
        {title}
      </h3>
    </div>
  );
};
