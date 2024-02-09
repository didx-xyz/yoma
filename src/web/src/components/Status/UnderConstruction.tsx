import Head from "next/head";
import iconImage from "public/images/icon-rocket.webp";
import { RoundedImage } from "../RoundedImage";

export const UnderConstruction = () => (
  <>
    <Head>
      <title>Yoma | Coming soon!</title>
    </Head>

    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <RoundedImage
          icon={iconImage}
          alt="Icon Rocket"
          imageWidth={28}
          imageHeight={28}
        />

        <h2 className="text-gray-900 my-2 text-lg font-medium">
          Under development
        </h2>
        <p className="text-gray-500 text-center">Coming soon ;)</p>
      </div>{" "}
    </div>
  </>
);
