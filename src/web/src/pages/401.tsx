import { type ReactElement } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";

const Status401: NextPageWithLayout = () => {
  return (
    <div className="container mt-8 w-[28rem] max-w-md">
      <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <h4>401 - Not authorized</h4>

        <FaExclamationTriangle size={100} className="my-10 text-yellow" />

        <p className="p-4 text-sm">Please sign in to view this page.</p>
      </div>
    </div>
  );
};

Status401.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status401;
