import { type ReactElement } from "react";
import { FaThumbsUp } from "react-icons/fa";
import MainLayout from "~/components/Layout/Main";
import { NextPageWithLayout } from "../_app";

const Success: NextPageWithLayout = () => {
  return (
    <div className="container w-[28rem] max-w-md">
      <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <h4>Success</h4>

        <FaThumbsUp size={100} className="my-10 text-green" />

        <p className="p-4 text-sm">
          Your organisation has been created. Please check your email for more
          details.
        </p>
      </div>
    </div>
  );
};

Success.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Success;
