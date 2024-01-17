import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { type ReactElement } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { getStoreCategories } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import type { StoreCategory } from "~/api/models/marketplace";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import Link from "next/link";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { THEME_BLUE } from "~/lib/constants";
import { CategoryCardComponent } from "~/components/Marketplace/CategoryCard";
import { IoMdArrowRoundBack } from "react-icons/io";
import Breadcrumb from "~/components/Breadcrumb";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["StoreCategories"],
    queryFn: () => getStoreCategories(context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const MarketplaceStoreCategories: NextPageWithLayout<{
  error: string;
}> = ({ error }) => {
  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreCategory[]>({
    queryKey: ["StoreCategories"],
    queryFn: () => getStoreCategories(),

    enabled: !error,
  });

  if (error) return <Unauthorized />;

  return (
    <div className="flex w-full max-w-5xl flex-col items-start gap-4">
      {/* BREADCRUMB */}
      <Breadcrumb
        items={[
          {
            title: "Marketplace",
            url: "/marketplace",
            iconElement: (
              <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
            ),
          },
          {
            title: "Select category",
            url: "",
          },
        ]}
      />

      {/* ERRROR */}
      {dataError && <ApiErrors error={dataError} />}

      {/* LOADING */}
      {dataIsLoading && (
        <div className="flex justify-center rounded-lg bg-white p-8">
          <LoadingSkeleton />
        </div>
      )}

      {/* NO ROWS */}
      {data && data.length === 0 && (
        <div className="flex w-full justify-center rounded-lg bg-white p-8">
          <NoRowsMessage
            title={"No items found"}
            description={"Please refine your search criteria."}
          />
        </div>
      )}

      {data && data.length > 0 && (
        <div className="flex w-full flex-col gap-4">
          {/* GRID */}
          {data && data.length > 0 && (
            <div className="flex flex-row flex-wrap gap-2">
              {data.map((item, index) => (
                <CategoryCardComponent
                  key={index}
                  name={item.name}
                  imageURLs={item.storeImageURLs}
                  href={`/marketplace/${item.name}?categoryId=${item.id}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

MarketplaceStoreCategories.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceStoreCategories.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceStoreCategories;
