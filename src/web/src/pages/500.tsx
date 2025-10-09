import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import { InternalServerError } from "~/components/Status/InternalServerError";

const Status500: NextPageWithLayout = () => {
  return <InternalServerError />;
};

Status500.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status500;
