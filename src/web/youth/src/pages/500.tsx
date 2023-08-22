import { useRouter } from "next/router";
import { type ReactElement } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";

const Status500: NextPageWithLayout = () => {
  const router = useRouter();

  // 🔔button click events
  const handleBack = () => {
    router.back();
  };
  const handleHome = () => {
    void router.replace("/");
  };

  return (
    <div className="container w-[28rem] max-w-md">
      <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <h4>500 - Error</h4>

        <FaExclamationTriangle size={100} className="my-10 text-red-700" />

        <p className="p-4 text-sm">There was an unexpected error. Please try again later.</p>

        {/* buttons */}
        <div className="my-5 flex place-items-center space-x-2">
          <button type="button" className="btn-hover-glow btn btn-warning btn-sm gap-2" onClick={handleBack}>
            Try again
          </button>
          <button type="button" className="btn-hover-glow btn btn-success btn-sm gap-2" onClick={handleHome}>
            Return to home
          </button>
        </div>
      </div>
    </div>
  );
};

Status500.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status500;
