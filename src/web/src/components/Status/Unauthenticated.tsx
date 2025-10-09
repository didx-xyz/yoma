import Head from "next/head";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Link from "next/link";

export const Unauthenticated: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Unauthenticated</title>
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

          <h4>401 - Unauthenticated</h4>
          <p className="p-4 text-sm">
            You don&apos;t have access to this page.
          </p>
          <Link className="btn btn-primary px-12" href="/">
            Go back
          </Link>
        </div>
      </div>
    </>
  );
};
