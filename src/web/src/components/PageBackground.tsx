import Image from "next/image";
import worldMap from "public/images/world-map.webp";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";

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
        className="user-select-none pointer-events-none fixed h-[20rem] object-scale-down opacity-10 md:mt-20"
      />

      {/* STAMPS */}
      {includeStamps && (
        <div className="relative w-full max-w-5xl">
          <Image
            src={stamp1}
            alt="Stamp1"
            height={179}
            width={135}
            sizes="100vw"
            priority={true}
            className="absolute left-2 z-0 -rotate-3 mix-blend-plus-lighter"
          />
          <Image
            src={stamp2}
            alt="Stamp2"
            height={184}
            width={161}
            sizes="100vw"
            priority={true}
            className="absolute -top-6 right-0 z-0 mix-blend-plus-lighter"
          />
        </div>
      )}
    </div>
  );
};
