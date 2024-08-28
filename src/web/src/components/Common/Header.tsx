import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";

interface InputProps {
  title: string;
  url?: string | null;
  className?: string;
}

export const Header: React.FC<InputProps> = ({
  title,
  url,
  className = "text-sm md:text-base font-semibold text-black",
}) => {
  return (
    <div className="flex h-[24px] w-full flex-row items-center gap-2">
      <span
        className={`w-full truncate tracking-wider text-black ${className}`}
      >
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
