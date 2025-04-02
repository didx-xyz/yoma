import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoMdClose, IoMdCopy } from "react-icons/io";
import { toast } from "react-toastify";
import type {
  WalletVoucher,
  WalletVoucherSearchResults,
} from "~/api/models/marketplace";
import { searchVouchers } from "~/api/services/marketplace";
import Breadcrumb from "~/components/Breadcrumb";
import CustomModal from "~/components/Common/CustomModal";
import { Header } from "~/components/Common/Header";
import Suspense from "~/components/Common/Suspense";
import YoID from "~/components/Layout/YoID";
import { TransactionItemComponent } from "~/components/Marketplace/TransactionItem";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { WalletCard } from "~/components/YoID/WalletCard";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { LoadingInline } from "~/components/Status/LoadingInline";

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

      <div className="w-full lg:max-w-7xl">
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "Yo-ID", url: "/yoid", iconElement: <>💳</> },
              {
                title: "Wallet",
                iconElement: <>💸</>,
                selected: true,
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
            <Header title="💸 My Wallet" />
            <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
              <Suspense
                isLoading={!userProfile}
                loader={
                  <LoadingInline
                    className="h-[185px] flex-col p-0"
                    classNameSpinner="h-12 w-12"
                  />
                }
              >
                <WalletCard userProfile={userProfile!} />
              </Suspense>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Header title="🛒 My Products" />

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
