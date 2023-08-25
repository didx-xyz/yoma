import { useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { navbarColorAtom } from "~/lib/store";

// * global app concerns
// * needs to be done here as jotai atoms are not available in _app.tsx
export const Global: React.FC = () => {
  // 🔔 ROUTE CHANGE HANDLER
  // set navbarColor atom on route change
  // used to change navbar color per page
  const router = useRouter();
  const setNavbarColor = useSetAtom(navbarColorAtom);

  useEffect(() => {
    if (
      router.asPath.startsWith("/dashboard/opportunities") ||
      router.asPath.startsWith("/dashboard/opportunity")
    )
      setNavbarColor("bg-blue");
    else if (
      router.asPath.startsWith("/user") ||
      router.asPath.startsWith("/organisation")
    )
      setNavbarColor("bg-blue-dark");
    else setNavbarColor("bg-purple");
  }, [router, setNavbarColor]);

  return null;
};
