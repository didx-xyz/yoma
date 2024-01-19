import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { type ReactElement, useMemo } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { searchVouchers } from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import type { WalletVoucher } from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { THEME_BLUE } from "~/lib/constants";
import { useRouter } from "next/router";
import { WalletVoucherSearchResults } from "~/api/models/reward";
import iconZlto from "public/images/icon-zlto.svg";
import Image from "next/image";
import { toBase64, shimmer } from "~/lib/image";

type GroupedData = {
  [key: number]: WalletVoucher[];
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server

  await queryClient.prefetchQuery({
    queryKey: ["Vouchers"],
    queryFn: () =>
      searchVouchers(
        {
          pageNumber: 1,
          pageSize: 100,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const MarketplaceTransactions: NextPageWithLayout<{}> = () => {
  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<WalletVoucherSearchResults>({
    queryKey: ["Vouchers"],
    queryFn: () =>
      searchVouchers({
        pageNumber: 1,
        pageSize: 100,
      }),
  });

  // memoize the data grouped by date
  const dataByDate = useMemo<GroupedData | null>(() => {
    if (!data?.items) return null;

    const groupedByDate = data.items.reduce<GroupedData>((acc: any, item) => {
      const date = item.amount; //TODO: hacked for now

      if (!acc[date]) acc[date] = [];
      acc[date].push(item);

      return acc;
    }, {});

    return groupedByDate;
  }, [data]);

  return (
    <div className="flex w-full max-w-5xl flex-col items-start gap-4">
      <h4>My vouchers</h4>

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
      {dataByDate && Object.keys(dataByDate).length > 0 && (
        <div className="flex w-full flex-col flex-wrap gap-4">
          {Object.entries(dataByDate).map(([date, items]) => (
            <div key={date} className="flex flex-col gap-2">
              <label className="text-sm text-gray-dark">{date}</label>
              {items.map((item, index) => (
                <TransactionItemComponent
                  key={`${date}-${index}`}
                  item={item}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TransactionItemComponent: React.FC<{
  key: string;
  item: WalletVoucher;
}> = ({ key, item }) => {
  return (
    <button
      type="button"
      key={key}
      className="flex h-14 w-full transform-gpu flex-row items-center gap-2 rounded-lg bg-white p-8 shadow-lg transition-transform hover:scale-105"
    >
      <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full shadow">
        {/* {imageURLs &&
            imageURLs.length > 0 &&
            imageURLs.map((url, index) => (
              <Image
                key={`${key}_${index}`}
                src={url}
                alt={`Store Category ${index}`}
                width={64}
                height={64}
                sizes="(max-width: 64px) 30vw, 50vw"
                priority={true}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(64, 64),
                )}`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "64px",
                  maxHeight: "64px",
                }}
              />
            ))}
          {!imageURLs ||
            (imageURLs.length === 0 && ( */}
        <Image
          src={iconZlto}
          alt={`Zlto icon`}
          width={48}
          height={48}
          sizes="(max-width: 48px) 30vw, 50vw"
          priority={true}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(48, 48))}`}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "48px",
            maxHeight: "48px",
          }}
        />
        {/* ))} */}
      </div>
      {/* TODO: */}
      <div className="flex flex-grow flex-col items-start">
        <p className="w-fullx overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-black md:max-w-[580px]">
          {item.name}
        </p>
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-black md:max-w-[580px]">
          {item.category}
        </p>
      </div>
    </button>
  );
};

MarketplaceTransactions.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

MarketplaceTransactions.theme = function getTheme() {
  return THEME_BLUE;
};

export default MarketplaceTransactions;
