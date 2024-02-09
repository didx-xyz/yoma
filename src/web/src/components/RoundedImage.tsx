import Image from "next/image";

interface InputProps {
  icon: any;
  alt: string;
  imageWidth: number;
  imageHeight: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const RoundedImage: React.FC<InputProps> = ({
  icon,
  alt = "Icon",
  imageWidth = 28,
  imageHeight = 28,
  containerWidth = imageWidth + 20,
  containerHeight = imageHeight + 20,
}) => {
  return (
    <div
      className="h-[${containerHeight}px] w-[${containerWidth}px] flex items-center justify-center rounded-full bg-white shadow-lg"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    >
      <Image
        src={icon}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        sizes="100vw"
        priority={true}
        style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      />
    </div>
  );
};
