import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { useCallback, type ReactElement } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { searchStoreItemCategories } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { type ParsedUrlQuery } from "querystring";
import { config } from "~/lib/react-query-config";
import type {
  StoreItemCategorySearchResults,
  StoreItemSearchResults,
} from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { ItemCardComponent } from "~/components/Marketplace/ItemCard";
import { IoMdArrowRoundBack } from "react-icons/io";
import Breadcrumb from "~/components/Breadcrumb";
import { useRouter } from "next/router";
import { PaginationButtons } from "~/components/PaginationButtons";

interface IParams extends ParsedUrlQuery {
  category: string;
  store: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient(config);
  const { category, store } = context.params as IParams;
  const { countryId, categoryId, storeId, page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${category}_${store}_${page}`],
    queryFn: () =>
      searchStoreItemCategories(
        {
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          storeId: storeId?.toString() ?? "",
        },
        context,
      ),
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
      page: page ?? "1",
    },
  };
}

const MarketplaceStoreItemCategories: NextPageWithLayout<{
  countryId: string;
  category: string;
  categoryId: string;
  store: string;
  storeId: string;
  page?: string;
}> = ({ category, categoryId, store, storeId, countryId, page }) => {
  const router = useRouter();

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreItemCategorySearchResults>({
    queryKey: [`StoreCategoryItems_${category}_${store}_${page}`],
    queryFn: () =>
      searchStoreItemCategories({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        storeId: storeId?.toString() ?? "",
      }),
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/marketplace/${category}/${store}`,
        query: {
          categoryId: categoryId,
          storeId: storeId,
          page: value,
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [category, categoryId, store, storeId, router],
  );

  const onClick = useCallback((id: string) => {
    alert("click: " + id);
  }, []);

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
      {data?.items && data.items.length === 0 && (
        <div className="flex w-full justify-center rounded-lg bg-white p-8">
          <NoRowsMessage
            title={"No items found"}
            description={"Please refine your search criteria."}
          />
        </div>
      )}

      {/* GRID */}
      {data?.items && data.items.length > 0 && (
        <div className="flex flex-row flex-wrap gap-4">
          {data.items.map((item, index) => (
            <ItemCardComponent
              key={index}
              company={store}
              name={item.name}
              imageURL={item.imageURL}
              summary={item.summary}
              amount={item.amount}
              count={item.count}
              onClick={() => onClick(item.id)}
            />
          ))}
        </div>
      )}

      {/* PAGINATION BUTTONS */}
      <PaginationButtons
        currentPage={page ? parseInt(page) : 1}
        //NB: there is no totalCount from the api, so we set it to a high number
        totalItems={data?.items && data?.items.length > 0 ? 999 : null}
        pageSize={PAGE_SIZE}
        onClick={handlePagerChange}
        showPages={false}
      />
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
