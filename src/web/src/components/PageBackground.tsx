import { useAtomValue } from "jotai";
import { navbarColorAtom } from "~/lib/store";

export const PageBackground: React.FC = () => {
  const navbarColor = useAtomValue(navbarColorAtom);

  // return an absolute positioned page header background based on the color navbarColorAtom
  return (
    <div
      className={`absolute left-0 top-0 z-0 h-64 w-full md:h-[23rem] ${navbarColor} bg-[url('/images/world-map.svg')] bg-fixed bg-top bg-no-repeat`}
    />
  );
};
