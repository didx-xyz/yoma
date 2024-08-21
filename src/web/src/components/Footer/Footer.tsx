import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";

export const Footer: React.FC = () => {
  return (
    <footer className="flex w-full items-center p-2 px-4">
      <div className="flex-grow">
        {/* LINKS */}
        <div className="w-fullx flex flex-col gap-1 text-xs">
          <div className="flex flex-wrap gap-1">
            <span>© 2023 Yoma.</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="flex flex-row flex-wrap gap-1">
            <Link className="text-green hover:underline" href="/terms">
              Terms and Conditions
            </Link>
            <Link
              className="text-green hover:underline"
              href="mailto:help@yoma.world"
            >
              help@yoma.world
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-none">
        {/* LOGO */}
        <Link href="/">
          <Image
            src={logoPicDark}
            alt="Logo"
            priority={false}
            width={85}
            height={41}
          />
        </Link>
      </div>
    </footer>
  );
};
