import { useRouter } from "next/router";
import { IoMdArrowBack } from "react-icons/io";

interface InputProps {
  url?: string | null;
}

export const BackButton: React.FC<InputProps> = ({ url }) => {
  const router = useRouter();

  const handleClick = () => {
    if (url)
      // go to specified url
      router.push(url);
    else if (window.history.length <= 2)
      // go to home if no back history
      router.push("/");
    else router.back();
  };

  return (
    <button
      type="button"
      aria-label="Close"
      className="mr-2"
      onClick={handleClick}
    >
      <IoMdArrowBack className="h-6 w-6" />
    </button>
  );
};
