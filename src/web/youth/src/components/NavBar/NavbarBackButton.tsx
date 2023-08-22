import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { IoMdArrowBack } from "react-icons/io";

export type Props = ({
  rightMenuChildren,
}: {
  rightMenuChildren?: ReactElement;
}) => ReactElement;

export const NavbarBackButton: Props = ({ rightMenuChildren }) => {
  const router = useRouter();

  const handleClick = () => {
    // if (router.pathname === "/cart/result") {
    //   // return to home after payment
    //   router.replace("/");
    // } else if (url)
    //   // go to specified url
    //   router.push(url);
    // else if (window.history.length <= 2)
    //   router.push("/"); // go to home if no back history
    //else
    router.back();
  };

  return (
    <div id="topNav" className="fixed left-0 right-0 top-0 z-40">
      <div className="bg-base-100x navbar z-40">
        <div className="navbar-start">
          <button
            type="button"
            aria-label="Close"
            className="btn-hover-grow btn btn-square gap-2 border-none bg-transparent hover:border-none hover:bg-transparent"
            onClick={handleClick}
          >
            <IoMdArrowBack className="h-6 w-6" />
          </button>
        </div>

        <div className="navbar-end">{rightMenuChildren}</div>
      </div>
    </div>
  );
};
