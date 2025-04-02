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
      className={`bg-theme absolute top-0 left-0 z-0 flex w-full items-center justify-center ${className}`}
    >
      {/* WORLD MAP */}
      <Image
        src={worldMap}
        alt="world-map"
        width={640}
        className="user-select-none pointer-events-none fixed mt-14 h-auto object-scale-down opacity-10"
        priority={true}
      />

      {/* STAMPS */}
      {includeStamps && (
        <div className="relative w-full max-w-5xl">
          <Image
            src={stamp1}
            alt="Stamp1"
            width={135}
            sizes="100vw"
            priority={true}
            className="absolute left-2 z-0 h-auto -rotate-3 mix-blend-plus-lighter"
          />
          <Image
            src={stamp2}
            alt="Stamp2"
            width={161}
            sizes="100vw"
            priority={true}
            className="absolute -top-6 right-0 z-0 h-auto mix-blend-plus-lighter"
          />
        </div>
      )}
    </div>
  );
};
