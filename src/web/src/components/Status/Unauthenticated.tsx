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
      <div className="container mt-10 flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-md flex-col place-items-center justify-center gap-4 rounded-xl bg-white p-4 py-8 text-center">
          <Image
            src={IconRingBuoy}
            alt="Icon Ring Buoy"
            width={100}
            sizes="100vw"
            priority={true}
            className="shadow-custom mt-2 h-auto rounded-full p-4"
          />
          <h4>401 - Unauthenticated</h4>
          <p className="p-4 text-sm">You don’t have access to this page.</p>
          <Link className="btn btn-primary px-12" href="/">
            Go back
          </Link>
        </div>
      </div>
    </>
  );
};
