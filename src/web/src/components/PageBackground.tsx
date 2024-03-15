import Image from "next/image";
export const PageBackground: React.FC<{ height?: number }> = ({
  height = 23,
}) => {
  return (
    <div
      style={{ height: `${height}rem` }}
      className="bg-theme absolute left-0 top-0 z-0 flex h-32 w-full items-center justify-center"
    >
      <Image
        src={"/images/world-map.webp"}
        alt="world-map"
        width={1280}
        height={720}
        className="fixed h-[20rem] object-scale-down opacity-10 md:mt-20"
      />
    </div>
  );
};
