import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "./_app";
import { Unauthenticated } from "~/components/Status/Unauthenticated";

const Status401: NextPageWithLayout = () => {
  return <Unauthenticated />;
};

Status401.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Status401;
