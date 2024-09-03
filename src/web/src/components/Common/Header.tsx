import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";

interface InputProps {
  title: string;
  url?: string | null;
  className?: string;
  onClick?: () => void;
}

export const Header: React.FC<InputProps> = ({
  title,
  url,
  className = "text-sm font-semibold text-black",
  onClick,
}) => {
  return (
    <div className="flex h-[24px] w-full flex-row items-center gap-2">
      <span className={`w-full truncate tracking-wider ${className}`}>
        {title}
      </span>

      {url && (
        <Link
          href={url}
          className="flex items-center whitespace-nowrap text-sm text-gray-dark"
          onClick={onClick}
        >
          <MdKeyboardArrowRight className="mr-2 h-6 w-6"></MdKeyboardArrowRight>
        </Link>
      )}
    </div>
  );
};
