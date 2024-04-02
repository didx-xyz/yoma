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

      <div className="container mt-10 flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-md flex-col place-items-center justify-center gap-4 rounded-xl bg-white p-4 py-8 text-center">
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
          <h4>Error</h4>
          <p className="text-gray-500 text-center">
            We are unable to show this page right now.
          </p>
          <p className="text-gray-500 text-center">Please try again later.</p>
          <Link className="btn btn-primary px-12" href="/">
            Go back
          </Link>
        </div>
      </div>
    </>
  );
};
