import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { type ReactElement } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { listStoreItemCategories } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { type ParsedUrlQuery } from "querystring";
import { config } from "~/lib/react-query-config";
import type { StoreItemCategory } from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { THEME_BLUE } from "~/lib/constants";
import { ItemCardComponent } from "~/components/Marketplace/ItemCard";
import { IoMdArrowRoundBack } from "react-icons/io";
import Breadcrumb from "~/components/Breadcrumb";

interface IParams extends ParsedUrlQuery {
  category: string;
  store: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient(config);
  const { category, store } = context.params as IParams;
  const { countryId, categoryId, storeId } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${category}_${store}`],
    queryFn: () => listStoreItemCategories(storeId!.toString(), context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      countryId: countryId ?? null,
      category: category ?? null,
      categoryId: categoryId ?? null,
      store: store ?? null,
      storeId: storeId ?? null,
    },
  };
}

const MarketplaceStoreItemCategories: NextPageWithLayout<{
  countryId: string;
  category: string;
  categoryId: string;
  store: string;
  storeId: string;
}> = ({ category, categoryId, store, storeId, countryId }) => {
  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreItemCategory[]>({
    queryKey: [`StoreCategoryItems_${category}_${store}`],
    queryFn: () => listStoreItemCategories(storeId),
  });

  return (
    <div className="flex w-full max-w-5xl flex-col items-start gap-4">
      {/* BREADCRUMB */}
      <Breadcrumb
        items={[
          {
            title: "Marketplace",
            url: `/marketplace?countryId=${countryId}`,
            iconElement: (
              <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
            ),
          },
          {
            title: category,
            url: `/marketplace/${category}?countryId=${countryId}&categoryId=${categoryId}`,
          },
          {
            title: store,
            url: "",
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
        <div className="flex flex-col items-center gap-4">
          {/* GRID */}
          {data && data.length > 0 && (
            <div className="flex flex-row flex-wrap gap-4">
              {data.map((item, index) => (
                <ItemCardComponent
                  key={index}
                  company={store}
                  name={item.name}
                  imageURL={item.imageURL}
                  summary={item.summary}
                  amount={item.amount}
                  href={`/marketplace/${category}/${store}/${item.name}?countryId=${countryId}&categoryId=${categoryId}&storeId=${storeId}&itemCategoryId=${item.id}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

MarketplaceStoreItemCategories.getLayout = function getLayout(
  page: ReactElement,
) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceStoreItemCategories.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceStoreItemCategories;
