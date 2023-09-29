import { useAtomValue } from "jotai";
import { navbarColorAtom } from "~/lib/store";

export const PageBackground: React.FC = () => {
  const navbarColor = useAtomValue(navbarColorAtom);

  // return an absolute positioned page header background based on the color navbarColorAtom
  return (
    <div className={`absolute left-0 top-0 z-0 h-56 w-full ${navbarColor}`} />
  );
};
