import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";

interface InputProps {
  title: string;
  url?: string | null;
}

export const HeaderWithLink: React.FC<InputProps> = ({ title, url }) => {
  return (
    <div className="flex h-[24px] flex-row items-center gap-2">
      <span className="w-full truncate text-xs font-bold tracking-wider text-black md:text-sm">
        {title}
      </span>

      {url && (
        <Link
          href={url}
          className="my-auto items-end whitespace-nowrap text-sm text-gray-dark"
        >
          <MdKeyboardArrowRight className="mr-2 h-6 w-6"></MdKeyboardArrowRight>
        </Link>
      )}
    </div>
  );
};
