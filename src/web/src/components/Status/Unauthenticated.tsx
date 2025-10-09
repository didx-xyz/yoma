import Head from "next/head";
import Image from "next/image";
import IconRingBuoy from "/public/images/icon-ring-buoy.svg";
import Link from "next/link";
import { SignInButton } from "../SignInButton";

export const Unauthenticated: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Unauthenticated</title>
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

          <h2 className="-mb-6 font-bold">Welcome Back!</h2>

          <p className="text-gray-dark text-center">
            This content is just a click away.
            <br /> Please login to continue your journey with Yoma.
          </p>

          <SignInButton className="!bg-green" />
        </div>
      </div>
    </>
  );
};
