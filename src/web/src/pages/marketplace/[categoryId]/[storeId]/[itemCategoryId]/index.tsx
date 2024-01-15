import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import React, { type ReactElement, useRef, useCallback } from "react";
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
import { toBase64, shimmer } from "~/lib/image";
import Image from "next/image";
import { PAGE_SIZE } from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";

interface IParams extends ParsedUrlQuery {
  categoryId: string;
  storeId: string;
  itemCategoryId: string;
  // query?: string;
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
  const { categoryId, storeId, itemCategoryId } = context.params as IParams;
  const { /*query,*/ page } = context.query;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: [`StoreCategoryItems_${categoryId}_${storeId}_${itemCategoryId}`],
    queryFn: () =>
      searchStoreItems(
        {
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          storeId: storeId.toString() ?? null,
          itemCategoryId: parseInt(itemCategoryId.toString()),
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      categoryId: categoryId ?? null,
      storeId: storeId ?? null,
      itemCategoryId: itemCategoryId ?? null,
      //query: query ?? null,
      page: page ?? "1",
    },
  };
}

const MarketplaceSearchStoreItems: NextPageWithLayout<{
  categoryId: string;
  storeId: string;
  itemCategoryId: string;
  //query?: string;
  page?: string;
  error: string;
}> = ({ /*query, */ categoryId, storeId, itemCategoryId, page, error }) => {
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
        pathname: `/marketplace/${categoryId}/${storeId}/${itemCategoryId}`,
        query: { /* query: query,*/ page: value },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [, /*query*/ categoryId, storeId, itemCategoryId, router],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <div className="flex w-full flex-col gap-4">
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
          <div className="flex justify-center rounded-lg bg-white p-8">
            <NoRowsMessage
              title={"No categories found"}
              description={"Store categories will be diplayed here."}
            />
          </div>
        )}

        {data && data.items?.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            {/* GRID */}
            {data && data.items?.length > 0 && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.items?.map((item, index) => (
                  <Link
                    key={index}
                    className="flex h-[180px] cursor-pointer flex-col rounded-lg bg-white p-2"
                    href={`/marketplace/${categoryId}/${storeId}/${itemCategoryId}/${item.id}`}
                  >
                    <div className="flex h-full flex-row">
                      <div className="flex flex-grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="max-h-[35px] overflow-hidden text-ellipsis text-sm font-semibold text-gray-dark">
                            {item.name}
                          </p>
                          <p className="max-h-[80px] overflow-hidden text-ellipsis text-sm font-bold">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row items-start">
                        <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-full shadow">
                          <Image
                            src={item.imageURL}
                            alt={`${item.name} Logo`}
                            width={60}
                            height={60}
                            sizes="(max-width: 60px) 30vw, 50vw"
                            priority={true}
                            placeholder="blur"
                            blurDataURL={`data:image/svg+xml;base64,${toBase64(
                              shimmer(44, 44),
                            )}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              maxWidth: "60px",
                              maxHeight: "60px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* <div className="flex flex-row items-center justify-center">
                      <div className="flex flex-grow text-xs tracking-widest">
                        <Moment format={DATETIME_FORMAT_SYSTEM}>
                          {new Date(item.dateIssued!)}
                        </Moment>
                      </div>
                      <div className="badge h-6 rounded-md bg-green-light text-xs font-bold text-green">
                        <IoMdCheckmark className="mr-1 h-4 w-4" />
                        Verified
                      </div>
                    </div> */}
                  </Link>
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
    </>
  );
};

MarketplaceSearchStoreItems.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

export default MarketplaceSearchStoreItems;
