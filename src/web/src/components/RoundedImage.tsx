import Image from "next/image";

export const RoundedImage: React.FC<{
  icon: any;
  alt: string;
  imageSize: number;
  containerSize?: number;
  priority?: boolean;
}> = ({
  icon,
  alt = "Icon",
  imageSize: imageWidth = 28,
  containerSize = imageWidth + 20,
  priority = true,
}) => {
  return (
    <div
      className="h-[${containerHeight}px] w-[${containerWidth}px] flex items-center justify-center rounded-full bg-white shadow-lg"
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
      }}
    >
      <Image
        src={icon}
        alt={alt}
        width={imageWidth}
        className="h-auto"
        sizes="100vw"
        priority={priority}
      />
    </div>
  );
};
