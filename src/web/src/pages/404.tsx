import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Link from "next/link";

const Status404: NextPageWithLayout = () => {
  return (
    <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
      <div className="bg-theme absolute top-0 z-2 h-[256px] w-full"></div>
      <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
        <Image
          src={IconRingBuoy}
          alt="Icon Ring Buoy"
          width={100}
          sizes="100vw"
          priority={true}
          className="shadow-custom mt-2 h-auto rounded-full p-4"
        />

        <h2 className="-mb-6 font-bold">Oops!</h2>
        <p className="text-gray-dark text-center">
          We can&apos;t seem to find the page you are looking for.
        </p>
        <Link
          href="/"
          className="btn btn-success mt-2 mb-4 rounded-3xl px-8 text-white"
        >
          Take me home
        </Link>
      </div>
    </div>
  );
};

Status404.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status404;
