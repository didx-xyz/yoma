import Head from "next/head";
import iconImage from "public/images/icon-rocket.svg";
import Image from "next/image";

export const UnderConstruction = () => (
  <>
    <Head>
      <title>Yoma Partner | Coming soon!</title>
    </Head>

    <div className="flex h-full max-h-[350px] w-full max-w-md flex-col items-center justify-center gap-1 rounded-lg bg-white">
      {/* eslint-disable */}
      <Image
        src={iconImage}
        alt="Logo"
        priority={true}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto", maxWidth: "100px" }}
      />
      {/* eslint-enable */}

      <h2 className="text-gray-900 mb-2 text-lg font-medium">
        Under development
      </h2>
      <p className="text-gray-500 text-center">Coming soon ;)</p>
    </div>
  </>
);
