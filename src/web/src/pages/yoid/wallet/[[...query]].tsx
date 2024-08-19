import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoMdClose, IoMdCopy } from "react-icons/io";
import ReactModal from "react-modal";
import { toast } from "react-toastify";
import type {
  WalletVoucher,
  WalletVoucherSearchResults,
} from "~/api/models/marketplace";
import { searchVouchers } from "~/api/services/marketplace";
import Breadcrumb from "~/components/Breadcrumb";
import Suspense from "~/components/Common/Suspense";
import YoID from "~/components/Layout/YoID";
import { TransactionItemComponent } from "~/components/Marketplace/TransactionItem";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { HeaderWithLink } from "~/components/YoID/HeaderWithLink";
import { WalletCard } from "~/components/YoID/WalletCard";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
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

  const queryClient = new QueryClient(config);
  const { page } = context.query;
  const pageNumber = page ? parseInt(page.toString()) : 1;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["Wallet", pageNumber],
    queryFn: () =>
      searchVouchers(
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
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

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(itemDialogVisible);

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
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback((value: number) => {
    // redirect
    void router.push({
      pathname: `/yoid/wallet`,
      query: { ...(value && { page: value }) },
    });
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
        <title>Yoma | 💸 Wallet</title>
      </Head>

      {/* ITEM DIALOG */}
      <ReactModal
        isOpen={itemDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setItemDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[550px] md:w-[550px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {currentItem && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-2">
            <div className="flex flex-row p-4">
              <h1 className="flex-grow"></h1>
              <button
                type="button"
                className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
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
                  <div className="text-xs font-bold text-gray-dark">
                    Voucher Code
                  </div>

                  <div className="flex w-full flex-row items-center rounded-full bg-gray p-2">
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
                  <div className="w-full text-xs text-gray-dark">Paid with</div>
                  <div className="whitespace-nowrap text-sm font-semibold">
                    {currentItem.amount} ZLTO
                  </div>
                </div>

                <div className="flex w-full flex-col md:flex-row">
                  <div className="w-full text-xs text-gray-dark">
                    Transaction number
                  </div>
                  <div className="whitespace-nowrap text-sm font-semibold">
                    {currentItem.id}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="w-full text-xs text-gray-dark">
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

              <div className="mt-2 flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn w-[150px] rounded-full bg-purple normal-case text-white hover:bg-purple-light hover:text-white"
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
      </ReactModal>

      <div className="w-full lg:max-w-7xl">
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "💸 Wallet",
                selected: true,
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
            <HeaderWithLink title="💸 My Wallet" />
            <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
              <Suspense isLoading={!userProfile}>
                <WalletCard userProfile={userProfile!} />
              </Suspense>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <HeaderWithLink title="🛒 My Products" />

            <Suspense isLoading={dataIsLoading} error={dataError}>
              {/* NO ROWS */}
              {pageNumber === 1 && !data?.items?.length && (
                <div className="flex justify-center rounded-lg bg-white p-8 text-center">
                  <NoRowsMessage
                    title={"No products found"}
                    description={
                      "You have not purchased any products yet. Go to the marketplace to buy some."
                    }
                  />
                </div>
              )}
              {pageNumber > 1 && !data?.items?.length && (
                <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
                  <NoRowsMessage
                    title={"No products found"}
                    description={
                      "There are no more products to display. Click back to see previous products."
                    }
                  />

                  <button
                    type="button"
                    className="btn w-[150px] rounded-full bg-purple normal-case text-white hover:bg-purple-light hover:text-white"
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
                  {/* PAGINATION INFO */}
                  <PaginationInfoComponent
                    currentPage={pageNumber}
                    itemCount={data?.items ? data.items.length : 0}
                    pageSize={PAGE_SIZE}
                    query={null}
                  />

                  {/* GRID */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.items.map((item, index) => (
                      <TransactionItemComponent
                        key={`transaction-${index}`}
                        data={item}
                        onClick={() => onItemClick(item)}
                      />
                    ))}
                  </div>

                  {/* PAGINATION BUTTONS */}
                  <div className="mt-2 grid place-items-center justify-center">
                    <PaginationButtons
                      currentPage={pageNumber}
                      pageSize={PAGE_SIZE}
                      onClick={handlePagerChange}
                      showPages={false}
                    />
                  </div>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

MyWallet.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MyWallet;
