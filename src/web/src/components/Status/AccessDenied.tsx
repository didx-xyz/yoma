import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";

export const AccessDenied = () => (
  <>
    <Head>
      <title>Yoma | Access Denied</title>
    </Head>
    <div className="container max-w-md">
      <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <h4>403 - Not authorized</h4>

        <FaExclamationTriangle size={100} className="my-10 text-yellow" />

        <p className="p-4 text-sm">
          You do not have permissions to view this page. Please contact us for
          support.
        </p>
      </div>
    </div>
  </>
);
