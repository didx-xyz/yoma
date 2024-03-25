import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";

export const InternalServerError: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Internal Server Error</title>
      </Head>

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
          <h4>Error</h4>

          <FaExclamationTriangle size={100} className="my-10 text-yellow" />

          <p className="text-gray-500 text-center">
            We are unable to show this page right now.
          </p>
          <p className="text-gray-500 text-center">Please try again later.</p>
        </div>
      </div>
    </>
  );
};
