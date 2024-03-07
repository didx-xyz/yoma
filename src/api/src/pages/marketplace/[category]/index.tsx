import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { type ReactElement } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { searchStores } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { type ParsedUrlQuery } from "querystring";
import { config } from "~/lib/react-query-config";
import type { StoreSearchResults } from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { THEME_BLUE } from "~/lib/constants";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CategoryCardComponent } from "~/components/Marketplace/CategoryCard";
import Breadcrumb from "~/components/Breadcrumb";

interface IParams extends ParsedUrlQuery {
  category: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient(config);
  const { category } = context.params as IParams;
  const { countryId, categoryId } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${category}`],
    queryFn: () =>
      searchStores(
        {
          //TODO: PAGING NOT SUPPORTED BY ZLTO
          pageNumber: null, //page ? parseInt(page.toString()) : 1,
          pageSize: null, //PAGE_SIZE,
          countryCodeAlpha2: countryId!.toString(),
          categoryId: categoryId!.toString() ?? null,
        },
        context,
      ),
  });
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategory_${category}`],
    queryFn: () =>
      searchStores(
        {
          //TODO: PAGING NOT SUPPORTED BY ZLTO
          pageNumber: null, //page ? parseInt(page.toString()) : 1,
          pageSize: null, //PAGE_SIZE,
          countryCodeAlpha2: countryId!.toString(),
          categoryId: categoryId!.toString() ?? null,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      countryId: countryId ?? null,
      category: category ?? null,
      categoryId: categoryId ?? null,
    },
  };
}

const MarketplaceSearchStores: NextPageWithLayout<{
  countryId: string;
  category: string;
  categoryId: string;
}> = ({ countryId, category, categoryId }) => {
  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreSearchResults>({
    queryKey: [`StoreCategoryItems_${category}`],
    queryFn: () =>
      searchStores({
        //TODO: PAGING NOT SUPPORTED BY ZLTO
        pageNumber: null, //page ? parseInt(page.toString()) : 1,
        pageSize: null, //PAGE_SIZE,
        countryCodeAlpha2: countryId,
        categoryId: categoryId,
      }),
  });

  return (
    <div className="flex w-full max-w-5xl flex-col items-start gap-4">
      {/* BREADCRUMB */}
      <Breadcrumb
        items={[
          {
            title: "Marketplace",
            url: `/marketplace${countryId ? `?countryId=${countryId}` : ""}`,
            iconElement: (
              <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
            ),
          },
          {
            title: category,
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
      {data && data.items?.length === 0 && (
        <div className="flex w-full justify-center rounded-lg bg-white p-8">
          <NoRowsMessage
            title={"No items found"}
            description={"Please refine your search criteria."}
          />
        </div>
      )}

      {data && data.items?.length > 0 && (
        <>
          <div className="flex gap-2 text-sm text-gray-dark">
            {data?.items.length} item categories found
          </div>

          {/* GRID */}
          {data?.items && data.items.length > 0 && (
            <div className="flex flex-row flex-wrap gap-4">
              {data.items.map((item, index) => (
                <CategoryCardComponent
                  key={`card_${index}`}
                  id={`card_${index}`}
                  name={item.name}
                  imageURLs={
                    item.imageURL != null && item.imageURL != "default"
                      ? [item.imageURL]
                      : []
                  }
                  href={`/marketplace/${category}/${item.name}?countryId=${countryId}&categoryId=${categoryId}&storeId=${item.id}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

MarketplaceSearchStores.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceSearchStores.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceSearchStores;
