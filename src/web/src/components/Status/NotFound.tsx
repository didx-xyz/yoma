import Head from "next/head";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Image from "next/image";
import Link from "next/link";

export const NotFound = () => (
  <>
    <Head>
      <title>Yoma | Not found</title>
    </Head>

    <div className="container mt-20 mb-10 flex flex-col items-center justify-start gap-12 px-4 md:mt-44">
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

        <h2 className="-mb-6 font-bold">Page Not Found</h2>

        <p className="text-gray-dark text-center">
          The page you&apos;re looking for doesn&apos;t exist.
          <br /> Let&apos;s get you back home.
        </p>

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
