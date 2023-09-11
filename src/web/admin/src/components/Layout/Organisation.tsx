import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactElement } from "react";

export type LayoutProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const OrganisationLayout: LayoutProps = ({ children }) => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <div className="flex flex-col items-center justify-center pt-6">
        <div className="tabs">
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}` ? "tab-active" : ""
            }`}
            href={`/organisations/${id}`}
          >
            Overview
          </Link>
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}/credentials`
                ? "tab-active"
                : ""
            }`}
            href={`/organisations/${id}/credentials`}
          >
            Credentials
          </Link>
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}/transactions`
                ? "tab-active"
                : ""
            }`}
            href={`/organisations/${id}/transactions`}
          >
            Transactions
          </Link>
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}/connections`
                ? "tab-active"
                : ""
            }`}
            href={`/organisations/${id}/connections`}
          >
            Connections
          </Link>
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}/opportunities`
                ? "tab-active"
                : ""
            }`}
            href={`/organisations/${id}/opportunities`}
          >
            Opportunities
          </Link>
          <Link
            className={`tab tab-bordered ${
              router.asPath === `/organisations/${id}/trustRegistry`
                ? "tab-active"
                : ""
            }`}
            href={`/organisations/${id}/trustRegistry`}
          >
            Trust Registry
          </Link>
        </div>
        <div className="flex">{children}</div>
      </div>
    </>
  );
};

export default OrganisationLayout;
