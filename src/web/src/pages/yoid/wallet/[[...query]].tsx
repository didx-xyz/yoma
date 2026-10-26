import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoMdClose, IoMdCopy } from "react-icons/io";
import {
  IoBagHandleOutline,
  IoInformationCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import type {
  WalletVoucher,
  WalletVoucherSearchResults,
} from "~/api/models/marketplace";
import { WalletCreationStatus } from "~/api/models/user";
import { searchVouchers } from "~/api/services/marketplace";
import CustomModal from "~/components/Common/CustomModal";
import Suspense from "~/components/Common/Suspense";
import YoID from "~/components/Layout/YoID";
import { TransactionItemComponent } from "~/components/Marketplace/TransactionItem";
import NoRowsMessage from "~/components/NoRowsMessage";
import { formatNumber } from "~/features/discovery/lib/format";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { Pager } from "~/components/YoID/Pager";
import {
  PAGER_SCROLL_MARGIN_CLASS,
  usePagerScroll,
} from "~/components/YoID/usePagerScroll";
import { WalletCard } from "~/components/YoID/WalletCard";
import { WalletInfoCard } from "~/components/YoID/WalletInfoCard";
import {
  DetailDisclosure,
  TONE,
} from "~/components/Opportunity/TabbedDetails/DetailDisclosure";
import { YoIDBreadcrumb } from "~/components/YoID/YoIDBreadcrumb";
import { INTRO_LINK_CLASS } from "~/components/YoID/YoIDIntro";
import {
  LoadingStatus,
  OpportunityGridSkeleton,
  TileBodySkeleton,
} from "~/components/YoID/YoIDSkeletons";
import { YOID_TABS, walletPreview } from "~/components/YoID/yoidTabs";
import { CARD_GRID_CLASS } from "~/lib/card";
import { PAGE_SIZE } from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

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

  const { page } = context.query;
  const pageNumber = page ? parseInt(page.toString()) : 1;

  return {
    props: {
      user: session?.user ?? null,
      pageNumber: pageNumber,
    },
  };
}

const MyWallet: NextPageWithLayout<{
  pageNumber: number;
  error: string;
}> = ({ pageNumber, error }) => {
  const [currentItem, setCurrentItem] = useState<WalletVoucher | null>(null);
  const [itemDialogVisible, setItemDialogVisible] = useState(false);
  const [userProfile] = useAtom(userProfileAtom);
  // The products search fails with a validation error until the reward wallet exists; the profile
  // already says whether it does, so a pending wallet is explained here and never requested
  // (Jason, 2026-10-21).
  const walletReady =
    userProfile?.zlto?.walletCreationStatus === WalletCreationStatus.Created;

  // the two section cards, open by default as on the overview (My Products is a results list,
  // not a card — Jason, 2026-10-22)
  type WalletSection = "balance" | "info";
  const [open, setOpen] = useState<Record<WalletSection, boolean>>({
    balance: true,
    info: true,
  });
  const toggle = (id: WalletSection): void =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));

  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery<WalletVoucherSearchResults>({
    queryKey: ["Wallet", pageNumber],
    queryFn: () =>
      searchVouchers({
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error && walletReady,
  });

  // 🔔 pager change event — the page number goes into the URL; `usePagerScroll` brings the
  // products back into view once it comes back
  const resultsRef = usePagerScroll(pageNumber);
  const handlePagerChange = useCallback((value: number) => {
    // redirect
    void router.push(
      {
        pathname: `/yoid/wallet`,
        query: { ...(value && { page: value }) },
      },
      undefined,
      { scroll: false },
    );
  }, []);

  const onItemClick = useCallback(
    (item: WalletVoucher) => {
      setCurrentItem(item);
      setItemDialogVisible(true);
    },
    [setCurrentItem, setItemDialogVisible],
  );

  const copyToClipboard = async () => {
    try {
      const permissions = await navigator.permissions.query({
        name: "clipboard-write" as PermissionName,
      });
      if (permissions.state === "granted" || permissions.state === "prompt") {
        await navigator.clipboard.writeText(currentItem?.code ?? "");
        toast.success("Text copied to clipboard!", { autoClose: 2000 });
      } else {
        throw new Error(
          "Can't access the clipboard. Check your browser permissions.",
        );
      }
    } catch (error) {
      toast.error(error?.toString());
    }
  };

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Wallet</title>
      </Head>

      {/* ITEM DIALOG */}
      <CustomModal
        isOpen={itemDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setItemDialogVisible(false);
        }}
        className={`md:max-h-[550px] md:w-[550px]`}
      >
        {currentItem && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-2">
            <div className="flex flex-row p-4">
              <h1 className="grow"></h1>
              <button
                type="button"
                className="btn bg-gray text-gray-dark hover:bg-gray-light rounded-full border-0 p-3"
                onClick={() => {
                  setItemDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-8">
              <h5 className="text-center">
                You purchased <strong>{currentItem.name}</strong>
              </h5>

              <div className="justify-centerx flex w-full flex-col gap-4">
                <div className="flex w-full flex-col justify-center gap-1">
                  <div className="text-gray-dark text-xs font-bold">
                    Voucher Code
                  </div>

                  <div className="bg-gray flex w-full flex-row items-center rounded-full p-2">
                    <div className="w-full font-semibold">
                      {currentItem.code}
                    </div>
                    <div>
                      <IoMdCopy
                        className="h-4 w-4 cursor-pointer"
                        onClick={copyToClipboard}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col md:flex-row">
                  <div className="text-gray-dark w-full text-xs">Paid with</div>
                  <div className="text-sm font-semibold whitespace-nowrap">
                    {currentItem.amount} ZLTO
                  </div>
                </div>

                <div className="flex w-full flex-col md:flex-row">
                  <div className="text-gray-dark w-full text-xs">
                    Transaction number
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">
                    {currentItem.id}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="text-gray-dark w-full text-xs">
                    Instructions
                  </div>
                  <div
                    className="text-sm font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: currentItem.instructions,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-2 flex grow gap-4">
                <button
                  type="button"
                  className="btn bg-purple hover:bg-purple-light w-[150px] rounded-full text-white normal-case hover:text-white"
                  onClick={() => {
                    setItemDialogVisible(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      <YoIDBreadcrumb trail={[{ title: YOID_TABS.wallet.label }]} />
      <LoadingStatus when={!userProfile || (walletReady && dataIsLoading)} />

      {/* The overview's / user menu's expandable section cards (Jason, 2026-10-22): icon square,
          title, note, chevron; all open by default. From `lg` the balance and the explainer share
          a row. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <DetailDisclosure
          id="wallet-balance"
          icon={<YOID_TABS.wallet.icon aria-hidden className="h-5 w-5" />}
          toneClass={TONE.gold}
          title="My Wallet"
          note="Your ZLTO balance and what's on its way."
          preview={walletPreview(userProfile)}
          open={open.balance}
          onToggle={() => toggle("balance")}
        >
          <Suspense isLoading={!userProfile} loader={<TileBodySkeleton />}>
            <WalletCard userProfile={userProfile!} />
          </Suspense>
        </DetailDisclosure>

        <DetailDisclosure
          id="wallet-info"
          icon={<IoInformationCircleOutline aria-hidden className="h-5 w-5" />}
          toneClass={TONE.blue}
          title="How ZLTO works"
          note="Earn it, then spend it."
          preview="Earn it, then spend it"
          open={open.info}
          onToggle={() => toggle("info")}
        >
          <WalletInfoCard />
        </DetailDisclosure>

        {/* MY PRODUCTS — a list of results under a rail-style heading, not an expandable card */}
        <section
          ref={resultsRef}
          aria-labelledby="wallet-products-heading"
          className={`flex flex-col gap-2 lg:col-span-2 ${PAGER_SCROLL_MARGIN_CLASS}`}
        >
          <h2
            id="wallet-products-heading"
            className="font-nunito flex items-center gap-2 pt-3 text-base font-black tracking-normal text-black md:text-lg"
          >
            <IoBagHandleOutline aria-hidden className="h-5 w-5 shrink-0" />
            My Products
            {/* The API returns no total: the products through this page, "+" while a next page
                may exist (the passport chips' rule — never a number that could be wrong) */}
            {walletReady && !!data?.items?.length && (
              <span className="text-gray-dark text-sm font-semibold">
                {formatNumber((pageNumber - 1) * PAGE_SIZE + data.items.length)}
                {data.items.length >= PAGE_SIZE && "+"}
              </span>
            )}
          </h2>

          {/* WALLET PENDING — the products need the reward wallet, which is created in the
              background after sign-up */}
          {userProfile && !walletReady && (
            <div className="shadow-custom flex flex-col items-center gap-2 rounded-xl bg-white p-8 text-center">
              <IoTimeOutline aria-hidden className="text-green h-8 w-8" />
              <p className="text-sm font-semibold md:text-base">
                Your wallet is still being set up
              </p>
              <p className="text-gray-dark max-w-md text-xs md:text-sm">
                It usually takes less than 24 hours. Any ZLTO you earn in the
                meantime is safe and will show here once it is ready. Until
                then, have a look at what is in the{" "}
                <Link href="/marketplace" className={INTRO_LINK_CLASS}>
                  marketplace
                </Link>
                .
              </p>
            </div>
          )}

          <Suspense
            isLoading={!userProfile || (walletReady && dataIsLoading)}
            error={dataError}
            loader={<OpportunityGridSkeleton />}
          >
            {walletReady && (
              <>
                {/* NO ROWS */}
                {pageNumber === 1 && !data?.items?.length && (
                  <div className="shadow-custom flex justify-center rounded-xl bg-white p-8 text-center">
                    <NoRowsMessage
                      title={"No products found"}
                      description={
                        "You have not purchased any products yet. Go to the marketplace to buy some."
                      }
                    />
                  </div>
                )}
                {pageNumber > 1 && !data?.items?.length && (
                  <div className="shadow-custom flex flex-col items-center justify-center rounded-xl bg-white p-8 text-center">
                    <NoRowsMessage
                      title={"No products found"}
                      description={
                        "There are no more products to display. Click back to see previous products."
                      }
                    />

                    <button
                      type="button"
                      className="btn bg-purple hover:bg-purple-light w-[150px] rounded-full text-white normal-case hover:text-white"
                      onClick={() => {
                        handlePagerChange(pageNumber - 1);
                      }}
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* GRID */}
                {!!data?.items?.length && (
                  <div className="flex flex-col gap-4">
                    {/* GRID */}
                    <div className={CARD_GRID_CLASS}>
                      {data.items.map((item, index) => (
                        <TransactionItemComponent
                          key={`transaction-${index}`}
                          data={item}
                          onClick={() => onItemClick(item)}
                        />
                      ))}
                    </div>

                    {/* PAGER — the API has no total, so Next is disabled on a short page */}
                    <div className="mt-2">
                      <Pager
                        page={pageNumber}
                        hasNext={data.items.length >= PAGE_SIZE}
                        onChange={handlePagerChange}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </Suspense>
        </section>
      </div>
    </>
  );
};

MyWallet.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MyWallet;
