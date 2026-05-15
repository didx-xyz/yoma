import Image from "next/image";
import { NoImage } from "~/components/Common/NoImage";

export const SquareImage: React.FC<{
  imageURL: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}> = ({ imageURL, name, size = 50, className = "" }) => {
  if (imageURL) {
    return (
      <Image
        src={imageURL}
        alt={name}
        width={size}
        height={size}
        className={`rounded-lg object-cover shadow-md ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg shadow-md ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
    >
      <NoImage />
    </div>
  );
};
