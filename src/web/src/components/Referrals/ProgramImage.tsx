import Image from "next/image";

interface ProgramImageProps {
  imageURL: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}

export const ProgramImage: React.FC<ProgramImageProps> = ({
  imageURL,
  name,
  size = 50,
  className = "",
}) => {
  if (imageURL) {
    return (
      <Image
        src={imageURL}
        alt={name}
        width={size}
        height={size}
        className={`rounded-lg object-cover shadow-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-lg shadow-md ${
        className
      }`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <span className="text-3xl">🎯</span>
    </div>
  );
};
