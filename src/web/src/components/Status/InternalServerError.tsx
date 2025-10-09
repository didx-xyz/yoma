import Head from "next/head";
import Link from "next/link";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Image from "next/image";

export const InternalServerError: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Internal Server Error</title>
      </Head>

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

          <h2 className="-mb-6 font-bold">Error</h2>
          <p className="text-gray-dark text-center">
            We are unable to show this page right now.
          </p>
          <p className="text-gray-dark text-center">Please try again later.</p>
          <Link
            href="/"
            className="btn btn-success mt-2 mb-4 rounded-3xl px-8 text-white"
          >
            Take me home
          </Link>
        </div>
      </div>
    </>
  );
};
