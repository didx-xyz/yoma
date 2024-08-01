import Head from "next/head";

export const UnderConstruction = () => (
  <>
    <Head>
      <title>Yoma | Coming soon!</title>
    </Head>

    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4 md:p-16">
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white p-4 shadow-lg">
          🚀
        </div>

        <h2 className="text-gray-900 my-2 text-lg font-medium">
          Under development
        </h2>
        <p className="text-gray-500 text-center">Coming soon ;)</p>
      </div>
    </div>
  </>
);
