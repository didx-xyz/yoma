import type { GetStaticProps } from "next";
import Image from "next/image";
import React, {
  useCallback,
  type ReactElement,
  useState,
  useEffect,
  useRef,
} from "react";
import { type NextPageWithLayout } from "~/pages/_app";
import { listSearchCriteriaCountries } from "~/api/services/marketplace";
import MarketplaceLayout from "~/components/Layout/Marketplace";
import { COUNTRY_WW, THEME_BLUE } from "~/lib/constants";
import type { Country } from "~/api/models/lookups";
import Select from "react-select";
import { useRouter } from "next/router";
import ReactModal from "react-modal";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { userCountrySelectionAtom, userProfileAtom } from "~/lib/store";
import { useAtom, useSetAtom } from "jotai";
import iconLocation from "public/images/icon-location.svg";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { env } from "process";
import { MarketplaceDown } from "~/components/Status/MarketplaceDown";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

// 👇 SSG
// This page undergoes static generation at run time on the server-side.
// The build-time SSG has been disabled due to missing API url configuration in the CI pipeline (see getStaticPaths below).
// This process ensures that the initial data required for the filter options are readily available upon page load.
// After that, the page is redirected to /marketplace/{country} based on the country selection or the user's country (userProfile.countryId)
export const getStaticProps: GetStaticProps = async (context) => {
  // disable build-time SSG in CI environment
  if (env.CI) {
    return {
      props: { lookups_countries: null },

      // Next.js will attempt to re-generate the page:
      // - When a request comes in
      // - At most once every 300 seconds
      revalidate: 300,
    };
  }

  // check if marketplace is enabled
  const marketplace_enabled =
    env.MARKETPLACE_ENABLED?.toLowerCase() == "true" ? true : false;

  if (!marketplace_enabled)
    return {
      props: { marketplace_enabled },
    };

  const lookups_countries = await listSearchCriteriaCountries(context);

  return {
    props: { lookups_countries, marketplace_enabled },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

const Marketplace: NextPageWithLayout<{
  lookups_countries: Country[];
  error?: number;
  marketplace_enabled: boolean;
}> = ({ lookups_countries, error, marketplace_enabled }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const [userCountrySelection] = useAtom(userCountrySelectionAtom);
  const setUserCountrySelection = useSetAtom(userCountrySelectionAtom);
  const [countrySelectorDialogVisible, setCountrySelectorDialogVisible] =
    useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>();
  const myRef = useRef<HTMLDivElement>(null);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(countrySelectorDialogVisible);

  const onFilterCountry = useCallback(
    (value: string) => {
      if (value) router.push(`/marketplace/${value}`);
      else router.push(`/marketplace`);
    },
    [router],
  );

  // memo for countries
  const countryOptions = React.useMemo(() => {
    if (!lookups_countries) return [];
    return lookups_countries.map((c) => ({
      value: c.codeAlpha2,
      label: c.name,
    }));
  }, [lookups_countries]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (lookups_countries && userProfile?.countryId) {
      const country = lookups_countries.find(
        (x) => x.id == userProfile.countryId,
      );
      const codeAlpha2 = country ? country.codeAlpha2 : COUNTRY_WW; // if not found, default to WW
      onFilterCountry(codeAlpha2);
    } else if (userCountrySelection) {
      onFilterCountry(userCountrySelection);
    } else {
      timeoutId = setTimeout(() => setCountrySelectorDialogVisible(true), 500); // delay to allow atoms to load
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    userProfile?.countryId,
    setCountrySelectorDialogVisible,
    onFilterCountry,
    userCountrySelection,
    lookups_countries,
  ]);

  if (!marketplace_enabled) return <MarketplaceDown />;

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <div className="flex w-full max-w-7xl flex-col gap-4">
      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {countrySelectorDialogVisible && (
        <>
          <ReactModal
            isOpen={countrySelectorDialogVisible}
            shouldCloseOnOverlayClick={false}
            className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:max-w-[600px] md:rounded-3xl`}
            portalClassName={"fixed z-40"}
            overlayClassName="fixed inset-0 bg-overlay"
          >
            <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
              <div className="mt-20 flex flex-col items-center justify-center gap-4 p-4 md:p-0">
                <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <Image
                    src={iconLocation}
                    alt="Icon Location"
                    width={40}
                    height={40}
                    sizes="100vw"
                    priority={true}
                    style={{ width: "40px", height: "40px" }}
                  />
                </div>
                <h3>What is your Country?</h3>
                <p className="rounded-lg bg-gray-light p-4 text-center md:w-[450px]">
                  Select your country to view the available stores and items
                </p>

                <Select
                  instanceId={"country"}
                  classNames={{
                    control: () => "input input-xs w-[200px]",
                  }}
                  options={countryOptions}
                  onChange={(val) => setSelectedCountry(val?.value ?? "")}
                  value={countryOptions?.find(
                    (c) => c.value === selectedCountry,
                  )}
                  placeholder="Country"
                  inputId="input_country" // e2e
                  // fix menu z-index issue
                  // menuPortalTarget={myRef.current!}
                  // styles={{
                  //   menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  // }}
                />

                <div className="mt-4 flex w-full flex-grow justify-center gap-4">
                  <button
                    id="letsGoButton"
                    type="button"
                    className="btn w-3/4 max-w-[300px] rounded-full border-purple bg-purple normal-case text-white hover:bg-purple disabled:bg-gray disabled:text-gray-dark disabled:brightness-90"
                    onClick={() => {
                      setUserCountrySelection(selectedCountry ?? "");
                      setCountrySelectorDialogVisible(false);
                      onFilterCountry(selectedCountry ?? "");
                    }}
                    disabled={!selectedCountry}
                  >
                    Let&apos;s go!
                  </button>
                </div>
              </div>
            </div>
          </ReactModal>
        </>
      )}
      {!countrySelectorDialogVisible && <LoadingInline />}
    </div>
  );
};

Marketplace.getLayout = function getLayout(page: ReactElement) {
  return <MarketplaceLayout>{page}</MarketplaceLayout>;
};

Marketplace.theme = function getTheme() {
  return THEME_BLUE;
};

export default Marketplace;
