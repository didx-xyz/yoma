import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import React, { useCallback, type ReactElement } from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import {
  listStoreCategories,
  listSearchCriteriaCountries,
} from "~/api/services/marketplace";
import { authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import type { StoreCategory } from "~/api/models/marketplace";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { THEME_BLUE } from "~/lib/constants";
import { CategoryCardComponent } from "~/components/Marketplace/CategoryCard";
import { Country } from "~/api/models/lookups";
import Select from "react-select";
import { useRouter } from "next/router";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  // get country from query params
  const { countryId } = context.query;

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["StoreCountries"],
    queryFn: () => listSearchCriteriaCountries(context),
  });
  await queryClient.prefetchQuery({
    queryKey: ["StoreCategories"],
    queryFn: () => listStoreCategories(countryId?.toString() ?? "WW", context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      countryId: countryId ?? null,
    },
  };
}

const MarketplaceStoreCategories: NextPageWithLayout<{
  countryId: string;
}> = ({ countryId }) => {
  const router = useRouter();

  // 👇 use prefetched queries from server
  const {
    data: dataCountry,
    error: errorCountry,
    isLoading: isLoadingCountry,
  } = useQuery<Country[]>({
    queryKey: ["StoreCountries"],
    queryFn: () => listSearchCriteriaCountries(),
  });

  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<StoreCategory[]>({
    queryKey: ["StoreCategories"],
    queryFn: () => listStoreCategories(countryId ?? "WW"),
  });

  const onFilterCountry = useCallback((value: string) => {
    if (value) router.push(`/marketplace?countryId=${value}`);
    else router.push(`/marketplace`);
  }, []);

  // memo for countries
  const countryOptions = React.useMemo(() => {
    if (!dataCountry) return [];
    return dataCountry.map((c) => ({
      value: c.codeAlpha2,
      label: c.name,
    }));
  }, [dataCountry]);

  return (
    <div className="flex w-full max-w-5xl flex-col items-start gap-4">
      {/* FILTER: COUNTRY */}
      <div className="flex flex-row items-center justify-center gap-4">
        <div className="text-sm font-semibold text-gray-dark">Filter by:</div>
        <Select
          classNames={{
            control: () => "input input-xs w-[200px]",
          }}
          options={countryOptions}
          onChange={(val) => onFilterCountry(val?.value!)}
          value={countryOptions?.find((c) => c.value === countryId)}
          placeholder="Country"
          isClearable={true}
        />
      </div>

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
            <div className="flex flex-row flex-wrap gap-4">
              {data.map((item, index) => (
                <CategoryCardComponent
                  key={index}
                  name={item.name}
                  imageURLs={item.storeImageURLs}
                  href={`/marketplace/${item.name}?categoryId=${item.id}&countryId=${countryId}`}
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
