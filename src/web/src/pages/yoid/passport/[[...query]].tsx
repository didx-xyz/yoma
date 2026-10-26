import { useInfiniteQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { env } from "process";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { IoMdClose } from "react-icons/io";
import { IoConstructOutline } from "react-icons/io5";
import Moment from "react-moment";
import { toast } from "react-toastify";
import {
  ARTIFACT_TYPE_LABELS,
  type ArtifactType,
  type SSICredential,
  type SSICredentialInfo,
} from "~/api/models/credential";
import type { OpportunityType } from "~/api/models/opportunity";
import {
  getCredentialById,
  searchCredentials,
} from "~/api/services/credentials";
import { AvatarImage } from "~/components/AvatarImage";
import CustomModal from "~/components/Common/CustomModal";
import Suspense from "~/components/Common/Suspense";
import CredentialAttributes from "~/components/Credentials/CredentialAttributes";
import { PassportCredentials } from "~/components/Credentials/PassportCredentials";
import YoID from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { LoadMore } from "~/components/YoID/LoadMore";
import { YoIDBreadcrumb } from "~/components/YoID/YoIDBreadcrumb";
import { YoIDIntro } from "~/components/YoID/YoIDIntro";
import {
  LoadingStatus,
  PassportSkeleton,
} from "~/components/YoID/YoIDSkeletons";
import { YOID_TABS } from "~/components/YoID/yoidTabs";
import { useOpportunityTypesQuery } from "~/hooks/useOpportunityMutations";
import { DATETIME_FORMAT_SYSTEM, PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { toCredentialGroups } from "~/lib/credentials/credentialGroups";
import {
  credentialTypeKey,
  credentialTypeLabel,
  typeBadgeClass,
} from "~/lib/typeColours";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

/**
 * The wallet loads this many credentials at a time, and "Load more credentials" adds the next lot
 * to those already shown (Jason, 2026-10-20). Wallet search filters by schema type only, so the
 * type groups are built over everything loaded so far.
 */
const PASSPORT_PAGE_SIZE = PAGE_SIZE_MEDIUM;

/** Until the types lookup arrives a label falls back to the enum name. */
const NO_TYPES: OpportunityType[] = [];

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

  // check if passport is enabled
  const passport_enabled =
    env.NEXT_PUBLIC_PASSPORT_ENABLED?.toLowerCase() == "true" ? true : false;

  if (!passport_enabled)
    return {
      props: { passport_enabled },
    };

  return {
    props: {
      user: session?.user ?? null,
      passport_enabled,
    },
  };
}

const MyPassport: NextPageWithLayout<{
  error: string;
  passport_enabled: boolean;
}> = ({ error, passport_enabled }) => {
  const [credentialDialogVisible, setCredentialDialogVisible] = useState(false);
  // 👇 the *detail* response — `getCredentialById` returns the attributes the list item lacks
  const [activeCredential, setActiveCredential] =
    useState<SSICredential | null>(null);

  const {
    data,
    error: dataError,
    isLoading: dataIsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ["Credentials", "Passport", PASSPORT_PAGE_SIZE],
    queryFn: ({ pageParam }) =>
      searchCredentials({
        pageNumber: pageParam,
        pageSize: PASSPORT_PAGE_SIZE,
        schemaType: null,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      pages.length * PASSPORT_PAGE_SIZE < (lastPage.totalCount ?? 0)
        ? pages.length + 1
        : undefined,
    enabled: !error && passport_enabled,
  });

  const credentials = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const loaded = credentials.length;
  const total = data?.pages.at(-1)?.totalCount ?? loaded;

  const { data: types = NO_TYPES } = useOpportunityTypesQuery();
  const groups = useMemo(
    () => toCredentialGroups(credentials, types),
    [credentials, types],
  );

  const activeKey = activeCredential
    ? credentialTypeKey(activeCredential)
    : null;
  const activeLabel = activeKey ? credentialTypeLabel(types, activeKey) : "";

  const loadMore = () => void fetchNextPage();

  // Deep link from the overview's and the drawer's family pills: ?type=<key> starts the passport
  // on that type's chip. Then the URL is left clean — the param is an instruction, not state
  // (as discovery's ?personalize), so the chips the youth presses afterwards do not contradict it.
  const router = useRouter();
  // Every sighting of `?type` (a drawer pill tapped while already on this page keeps it
  // mounted) re-seeds the chips: `n` remounts `PassportCredentials` with the new `initialKey`.
  const [deepLink, setDeepLink] = useState<{ type: string | null; n: number }>(
    () => ({
      type: typeof router.query.type === "string" ? router.query.type : null,
      n: 0,
    }),
  );
  useEffect(() => {
    if (router.query.type === undefined) return;
    const type =
      typeof router.query.type === "string" ? router.query.type : null;
    setDeepLink((current) => ({ type, n: current.n + 1 }));
    const query = { ...router.query };
    delete query.type;
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per param sighting
  }, [router.query.type]);

  const handleOnClickCredential = (item: SSICredentialInfo) => {
    getCredentialById(item.id)
      .then((res) => {
        setActiveCredential(res);
        setCredentialDialogVisible(true);
      })
      .catch((err) => {
        toast.error("Unable to retrieve your credential");
        console.error(err);
      });
  };

  if (error) return <Unauthorized />;

  if (!passport_enabled)
    return (
      <>
        <Head>
          <title>Yoma | Passport Unavailable</title>
        </Head>

        <div className="container flex max-w-7xl flex-col items-center justify-center">
          <NoRowsMessage
            title={"Update in Progress"}
            description={
              "Credentials will begin displaying again soon. Thanks for your patience."
            }
            icon={
              <IoConstructOutline aria-hidden className="text-green h-5 w-5" />
            }
          />
        </div>
      </>
    );

  return (
    <>
      <Head>
        <title>Yoma | Passport</title>
      </Head>

      {/* CREDENTIAL DIALOG */}
      <CustomModal
        isOpen={credentialDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCredentialDialogVisible(false);
        }}
        className={`md:max-h-[650px] md:w-[600px]`}
      >
        {/* The dialog only opens once a credential has loaded. Only the body scrolls, inside the
            box's rounded corners: the header stays put and `md:pb-6` clears the bottom radius. */}
        {activeCredential && (
          <div className="flex h-full flex-col md:pb-6">
            {/* The BA Review's header: the type's colour, "<type> · YoID" */}
            <div
              className={`relative z-10 flex shrink-0 flex-row items-center p-4 shadow-lg ${typeBadgeClass(activeKey)}`}
            >
              <h1 className="grow text-sm font-bold tracking-wide text-white">
                <span className="uppercase">{activeLabel}</span> · YoID
              </h1>
              <button
                type="button"
                aria-label="Close"
                className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                onClick={() => {
                  setCredentialDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex min-h-0 grow flex-col items-center gap-4 overflow-y-auto pt-2">
              {activeCredential.issuerLogoURL && (
                <AvatarImage
                  icon={activeCredential.issuerLogoURL}
                  alt={`${activeCredential.issuer} Logo`}
                  size={60}
                />
              )}

              <div className="flex grow flex-col gap-4 p-4 pt-0 pb-8">
                <h4 className="text-center">{activeCredential.title}</h4>
                <span
                  className={`mx-auto rounded-full px-6 py-1.5 text-xs font-bold tracking-wide uppercase ${typeBadgeClass(activeKey)}`}
                >
                  {activeLabel}
                </span>

                {/* CREDENTIAL DETAILS */}
                <div className="bg-gray-light rounded border-dotted p-4 shadow">
                  {/* Fixed credential header. Deliberately outside attribute grouping by API
                        contract — these come from the credential's system properties, not from its
                        schema attributes, and carry no presentation metadata. */}
                  <ul className="divide-y divide-gray-200">
                    <li className="py-4">
                      <div className="flex justify-between text-sm">
                        <p className="font-semibold text-gray-500 md:w-64">
                          Issuer
                        </p>
                        <p className="text-end text-gray-900">
                          {activeCredential.issuer}
                        </p>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex justify-between text-sm">
                        <p className="font-semibold text-gray-500 md:w-64">
                          Artifact Type
                        </p>
                        {/* The API returns the enum *name*, so an AnonCreds credential rendered
                              as the bare "ACR". YOM-1281 added the friendly labels for this. */}
                        <p className="text-end text-gray-900">
                          {ARTIFACT_TYPE_LABELS[
                            activeCredential.artifactType as keyof typeof ArtifactType
                          ] ?? activeCredential.artifactType}
                        </p>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex justify-between text-sm">
                        <p className="font-semibold text-gray-500 md:w-64">
                          Date Issued
                        </p>
                        {activeCredential.dateIssued && (
                          <p className="text-end text-gray-900">
                            <Moment format={DATETIME_FORMAT_SYSTEM} utc={true}>
                              {activeCredential.dateIssued}
                            </Moment>
                          </p>
                        )}
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex justify-between text-sm">
                        <p className="font-semibold text-gray-500 md:w-64">
                          Schema Type
                        </p>
                        <p className="text-end text-gray-900">
                          {activeCredential.schemaType}
                        </p>
                      </div>
                    </li>
                  </ul>

                  {/* ATTRIBUTES — schema-driven, grouped and ordered entirely by the API */}
                  <CredentialAttributes
                    attributes={activeCredential.attributes}
                  />
                </div>

                <div className="mt-4 flex grow items-center justify-center gap-4 pb-14">
                  <button
                    type="button"
                    className="btn border-purple text-purple btn-outline btn-primary w-1/2 rounded-full bg-white normal-case md:w-[300px]"
                    onClick={() => {
                      setCredentialDialogVisible(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      <YoIDBreadcrumb trail={[{ title: YOID_TABS.passport.label }]} />
      <YoIDIntro>
        {YOID_TABS.passport.blurb} A new credential can take up to 24 hours to
        appear.
      </YoIDIntro>

      <LoadingStatus when={dataIsLoading} />
      <Suspense
        className="flex flex-col gap-4"
        isLoading={dataIsLoading}
        error={data ? undefined : dataError}
        loader={<PassportSkeleton />}
      >
        {/* NO ROWS */}
        {loaded === 0 && (
          <div className="flex justify-center rounded-lg bg-white p-8 text-center">
            <NoRowsMessage
              title={"No credentials found"}
              description={
                "Credentials that you receive by completing opportunities will be displayed here. Please be aware credentials will take 24 hours to reflect."
              }
            />
          </div>
        )}

        {loaded > 0 && (
          <PassportCredentials
            key={deepLink.n}
            groups={groups}
            total={total}
            complete={!hasNextPage}
            onOpen={handleOnClickCredential}
            initialKey={deepLink.type}
          />
        )}

        {/* LOAD MORE — the next page joins its groups in place */}
        {hasNextPage && (
          <LoadMore
            label="Load more credentials"
            noun="credentials"
            loaded={loaded}
            total={total}
            loading={isFetchingNextPage}
            failed={isFetchNextPageError}
            onLoadMore={loadMore}
            className="pt-2"
          />
        )}
      </Suspense>
    </>
  );
};

MyPassport.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MyPassport;
