import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";

export const MarketplaceDown: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Marketplace Unavailable</title>
      </Head>

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
          <h2 className="text-gray-900 text-lg font-medium">
            The marketplace is currently unavailable.
          </h2>{" "}
          <FaExclamationTriangle size={100} className="my-5 text-yellow" />
          <p className="text-gray-500 text-center">Please try again later :(</p>
        </div>
      </div>
    </>
  );
};
