import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import { Unauthorized } from "~/components/Status/Unauthorized";

const Status403: NextPageWithLayout = () => {
  return <Unauthorized />;
};

Status403.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status403;
