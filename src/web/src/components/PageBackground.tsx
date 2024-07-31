import Image from "next/image";
import stamps from "public/images/stamps.svg";
import worldMap from "public/images/world-map.webp";

export const PageBackground: React.FC<{
  className?: string;
  includeStamps?: boolean;
}> = ({ className = "h-80", includeStamps }) => {
  return (
    <div
      className={`bg-theme absolute left-0 top-0 z-0 flex w-full items-center justify-center ${className}`}
    >
      {/* WORLD MAP */}
      <Image
        src={worldMap}
        alt="world-map"
        width={1280}
        height={720}
        className="fixed h-[20rem] object-scale-down opacity-10 md:mt-20"
      />

      {/* STAMPS */}
      {includeStamps && (
        <Image
          src={stamps}
          alt="Stamps"
          height={400}
          width={700}
          sizes="100vw"
          priority={true}
          className="absolute top-20 opacity-25 brightness-200 grayscale"
        />
      )}
    </div>
  );
};
