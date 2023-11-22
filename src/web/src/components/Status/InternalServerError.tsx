import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";

export const InternalServerError: React.FC = () => {
  return (
    <>
      <Head>
        <title>Yoma | Internal Server Error</title>
      </Head>

      <div className="flex h-full max-h-[350px] w-full max-w-md flex-col items-center justify-center gap-1 rounded-lg bg-white">
        <FaExclamationTriangle size={100} className="my-10 text-yellow" />
        <h2 className="text-gray-900 mb-2 text-lg font-medium">Error</h2>
        <p className="text-gray-500 text-center">
          We are unable to show this page right now.
        </p>
        <p className="text-gray-500 text-center">Please try again later.</p>
      </div>
    </>
  );
};
