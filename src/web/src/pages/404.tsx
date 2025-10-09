import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import { NotFound } from "~/components/Status/NotFound";

const Status404: NextPageWithLayout = () => {
  return <NotFound />;
};

Status404.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status404;
