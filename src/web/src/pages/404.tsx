import { type ReactElement } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";

const Status404: NextPageWithLayout = () => {
  return (
    <div className="container mt-8 flex flex-col items-center justify-center gap-12 px-4">
      <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <h4>404 - Not found</h4>

        <FaExclamationTriangle size={100} className="my-10 text-yellow" />

        <p className="p-4 text-sm">The requested page does not exist.</p>
      </div>
    </div>
  );
};

Status404.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status404;
