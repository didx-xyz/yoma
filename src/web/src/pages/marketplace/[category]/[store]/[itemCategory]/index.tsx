import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import React, { type ReactElement, useCallback } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { searchStoreItems } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { type ParsedUrlQuery } from "querystring";
import { config } from "~/lib/react-query-config";
import type { StoreItemSearchResults } from "~/api/models/marketplace";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import Link from "next/link";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import { ItemCardComponent } from "~/components/Marketplace/ItemCard";
import { IoMdArrowRoundBack } from "react-icons/io";
import Breadcrumb from "~/components/Breadcrumb";

interface IParams extends ParsedUrlQuery {
  categoryId: string;
  storeId: string;
  itemCategoryId: string;
  page?: string;
}

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
  const { category, store, itemCategory } = context.params as IParams;
  const { categoryId, storeId, itemCategoryId, page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${categoryId}_${storeId}_${itemCategoryId}`],
    queryFn: () =>
      searchStoreItems(
        {
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          storeId: storeId!.toString() ?? null,
          itemCategoryId: parseInt(itemCategoryId!.toString()),
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      category: category ?? null,
      categoryId: categoryId ?? null,
      store: store ?? null,
      storeId: storeId ?? null,
      itemCategory: itemCategory ?? null,
      itemCategoryId: itemCategoryId ?? null,
      page: page ?? "1",
    },
  };
}

const MarketplaceSearchStoreItems: NextPageWithLayout<{
  category: string;
  categoryId: string;
  store: string;
  storeId: string;
  itemCategory: string;
  itemCategoryId: string;
  page?: string;
  error: string;
}> = ({
  category,
  categoryId,
  store,
  storeId,
  itemCategory,
  itemCategoryId,
  page,
  error,
}) => {
  const router = useRouter();

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreItemSearchResults>({
    queryKey: [`StoreCategoryItems_${categoryId}_${storeId}_${itemCategoryId}`],
    queryFn: () =>
      searchStoreItems({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        storeId: storeId.toString() ?? null,
        itemCategoryId: parseInt(itemCategoryId.toString()),
      }),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/marketplace/${category}/${store}/${itemCategory}`,
        query: {
          categoryId: categoryId,
          storeId: storeId,
          itemCategoryId,
          page: value,
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [
      ,
      /*query*/ category,
      categoryId,
      store,
      storeId,
      itemCategory,
      itemCategoryId,
      router,
    ],
  );

  const onClick = useCallback((id: number) => {
    alert("click: " + id);
  }, []);

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
            title: category,
            url: `/marketplace/${category}?categoryId=${categoryId}`,
          },
          {
            title: store,
            url: `/marketplace/${category}/${store}?categoryId=${categoryId}&storeId=${storeId}`,
          },
          {
            title: itemCategory,
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
        <div className="flex flex-col items-center gap-4">
          {/* GRID */}
          {data && data.items?.length > 0 && (
            <div className="flex flex-row flex-wrap gap-4">
              {data.items?.map((item, index) => (
                <ItemCardComponent
                  key={`StoreCategoryitem_${index}`}
                  company={store}
                  name={item.name}
                  imageURL={item.imageURL}
                  summary={item.summary}
                  amount={item.amount}
                  onClick={() => onClick(item.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION BUTTONS */}
            <PaginationButtons
              currentPage={page ? parseInt(page) : 1}
              //TODO: no totalCount from api
              totalItems={1000}
              // totalItems={data?.totalCount ?? 0}
              pageSize={PAGE_SIZE}
              onClick={handlePagerChange}
              showPages={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

MarketplaceSearchStoreItems.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceSearchStoreItems.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceSearchStoreItems;
