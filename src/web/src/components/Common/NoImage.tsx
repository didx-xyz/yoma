import { FiImage } from "react-icons/fi";

interface NoImageProps {
  className?: string;
  iconOnly?: boolean;
}

export const NoImage: React.FC<NoImageProps> = ({ className, iconOnly }) => {
  return (
    <div
      className={`from-gray-light to-gray flex h-full w-full items-center justify-center bg-linear-to-br ${className ?? ""}`}
    >
      <div className="text-gray-dark flex flex-col items-center gap-1 text-sm">
        <FiImage className="h-8 w-8 text-gray-400" aria-hidden="true" />
        {!iconOnly && "No image"}
      </div>
    </div>
  );
};
