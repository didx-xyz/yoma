import Head from "next/head";
import Link from "next/link";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Image from "next/image";

export const Unauthorized = () => (
  <>
    <Head>
      <title>Yoma | Access Denied</title>
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
        <h4>403 - Not authorized</h4>
        <p className="p-4 text-sm">
          You do not have permissions to view this page. Please contact us for
          support.
        </p>
        <Link className="btn btn-primary px-12" href="/">
          Go back
        </Link>
      </div>
    </div>
  </>
);
