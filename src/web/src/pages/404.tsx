import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Link from "next/link";

const Status404: NextPageWithLayout = () => {
  return (
    <div className="container flex flex-col items-center justify-start gap-12 md:mt-44 md:px-4">
      <div className="bg-theme z-2 absolute top-0 h-[256px] w-full"></div>
      <div className="z-10 flex h-full w-full max-w-md flex-col place-items-center justify-center gap-8 rounded-xl bg-white p-4 md:h-fit md:max-w-2xl md:p-16">
        <Image
          src={IconRingBuoy}
          alt="Icon Ring Buoy"
          width={100}
          height={100}
          sizes="100vw"
          priority={true}
          style={{ width: "100px", height: "100px" }}
          className="mt-2 rounded-full p-4 shadow-custom"
        />

        <h2 className="-mb-6 font-bold">Oops!</h2>
        <p className="text-center text-gray-dark">
          We can&apos;t seem to find the page you are looking for.
        </p>
        <Link
          href="/"
          className="btn btn-success mb-4 mt-2 rounded-3xl px-8 text-white"
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
