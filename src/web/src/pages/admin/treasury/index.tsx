import { dehydrate, QueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { toast } from "react-toastify";
import type {
  TreasuryFormField,
  TreasuryRequestUpdate,
} from "~/api/models/treasury";
import { getTreasury } from "~/api/services/treasury";
import { BTN_PRIMARY } from "~/components/Common/buttonStyles";
import {
  ListPageBody,
  ListPageHeader,
  ListPageShell,
} from "~/components/Common/ListPage/ListPageHeader";
import { ListPageResults } from "~/components/Common/ListPage/ListPageResults";
import {
  asString,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import ListPageTabs from "~/components/Common/ListPage/ListPageTabs";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import TreasuryCapacityWarnings from "~/components/Treasury/TreasuryCapacityWarnings";
import TreasuryManagementForm from "~/components/Treasury/TreasuryManagementForm";
import TreasuryOpportunitiesTab from "~/components/Treasury/TreasuryOpportunitiesTab";
import TreasuryOrganisationsTab from "~/components/Treasury/TreasuryOrganisationsTab";
import TreasuryOverview from "~/components/Treasury/TreasuryOverview";
import TreasuryRolloverConfirmDialog from "~/components/Treasury/TreasuryRolloverConfirmDialog";
import {
  TREASURY_QUERY_KEYS,
  useTreasuryQuery,
  useTreasuryUpdateMutation,
} from "~/hooks/useTreasuryMutations";
import { ROLE_ADMIN } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import type { FinancialYearAssessment } from "~/lib/treasury/financialYear";
import { mapTreasuryServerErrors } from "~/lib/treasury/serverErrors";
// ⚠️ TEMPORARY — mock-scenario dev aid; delete this import with the blocks it feeds
import {
  resolveTreasuryMockScenario,
  TREASURY_MOCK_SCENARIO_KEYS,
  TREASURY_MOCK_SCENARIOS,
} from "~/lib/treasury/treasuryMockScenarios";
import { getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session);

  // 👇 Admin only, like GET/PATCH /treasury itself
  if (!session.user?.roles.includes(ROLE_ADMIN)) {
    return {
      props: {
        theme: theme,
        error: 403,
      },
    };
  }

  try {
    // 👇 prefetch queries on server
    const data = await getTreasury(context);
    await queryClient.prefetchQuery({
      queryKey: TREASURY_QUERY_KEYS.detail(),
      queryFn: () => data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      theme: theme,
      error: errorCode,
    },
  };
}

/**
 * The two views, as banner tabs like every other admin page. Overview is the default and carries no
 * querystring, matching the "All" tab convention on the list pages — so `/admin/treasury` stays the
 * canonical url and `?tab=manage` is shareable and survives the back button.
 */
const TAB_PARAM = "tab";
const TAB_MANAGE = "manage";
const TAB_ORGANISATIONS = "organisations";
const TAB_OPPORTUNITIES = "opportunities";

/** The querystring tokens this page recognises; anything else falls back to Overview. */
const TABS = [TAB_MANAGE, TAB_ORGANISATIONS, TAB_OPPORTUNITIES] as const;
type TreasuryTab = (typeof TABS)[number];

/** ⚠️ TEMPORARY — part of the mock-scenario dev aid; remove with it. */
const MOCK_PARAM = "mock";

const treasuryHref = (tab: string | null, mock?: string | null) => {
  const params = new URLSearchParams();
  if (tab !== null) params.append(TAB_PARAM, tab);
  if (mock) params.append(MOCK_PARAM, mock); // ⚠️ TEMPORARY
  return params.size > 0
    ? `/admin/treasury?${params.toString()}`
    : "/admin/treasury";
};

// 👇 PAGE COMPONENT: Admin → Treasury
// The top of the reward hierarchy: what is available to award and pay out this financial year, and
// the configuration behind it. Admin role only.
const Treasury: NextPageWithLayout<{
  theme: string;
  error?: number;
}> = ({ error }) => {
  const router = useRouter();

  const routerQuery = router.query as ListPageRouterQuery;

  // 👇 the selected tab is driven by the querystring, not by state
  const activeTab: TreasuryTab | null = useMemo(() => {
    const raw = asString(routerQuery[TAB_PARAM]);
    return TABS.find((tab) => tab === raw) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  // ⚠️⚠️ MOCK SCENARIOS — TEMPORARY DEV AID, DELETE THIS BLOCK (and
  // lib/treasury/treasuryMockScenarios.ts, and MOCK_PARAM above) BEFORE MERGING ⚠️⚠️
  const mockScenario = resolveTreasuryMockScenario(
    asString(routerQuery[MOCK_PARAM]),
  );
  const mockTreasury = mockScenario
    ? TREASURY_MOCK_SCENARIOS[mockScenario]
    : null;
  // ⚠️⚠️ end MOCK SCENARIOS ⚠️⚠️

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
    isRefetching,
  } = useTreasuryQuery({ enabled: !error });

  const treasury = mockTreasury ?? data; // ⚠️ TEMPORARY: `= data` once the mock goes

  const updateMutation = useTreasuryUpdateMutation();

  /** Set while the rollover guard is waiting for an explicit confirmation. */
  const [pendingSave, setPendingSave] = useState<{
    request: TreasuryRequestUpdate;
    assessment: FinancialYearAssessment;
  } | null>(null);

  const [serverFieldErrors, setServerFieldErrors] = useState<
    Partial<Record<TreasuryFormField, string>> | undefined
  >();
  const [serverFormErrors, setServerFormErrors] = useState<string[]>([]);

  const save = useCallback(
    async (request: TreasuryRequestUpdate) => {
      setServerFieldErrors(undefined);
      setServerFormErrors([]);

      const financialYearStartBefore = treasury?.financialYearStartDate;

      try {
        const updated = await updateMutation.mutateAsync(request);
        setPendingSave(null);

        // A rollover zeroed the totals for the financial year. Show the admin that it happened
        // rather than leaving them on the form: switch to the Overview, where the reset is visible.
        const rolledOver =
          !!financialYearStartBefore &&
          updated.financialYearStartDate !== financialYearStartBefore;

        if (rolledOver) {
          toast.success(
            "Treasury updated — a new financial year has started and totals for the financial year have been reset",
            { autoClose: 6000 },
          );
          void router.push(treasuryHref(null, mockScenario), undefined, {
            scroll: false,
          });
          return;
        }

        toast.success("Treasury updated", { autoClose: 2000 });
      } catch (updateError) {
        // Close the dialog first — the mapped errors are on the form behind it.
        setPendingSave(null);

        const mapped = mapTreasuryServerErrors(updateError);
        if (mapped.isUnmapped) {
          toast(<ApiErrors error={updateError as AxiosError} />, {
            type: "error",
            toastId: "treasury-update-error",
            autoClose: false,
            icon: false,
          });
          return;
        }

        // NB: a new object each time, so the form re-applies the errors even when they repeat.
        setServerFieldErrors({ ...mapped.fieldErrors });
        setServerFormErrors(mapped.formErrors);
      }
    },
    [
      updateMutation,
      router,
      treasury?.financialYearStartDate,
      mockScenario, // ⚠️ TEMPORARY: only here to keep the mock in the url after a rollover
    ],
  );

  const handleFormSubmit = useCallback(
    (request: TreasuryRequestUpdate, assessment: FinancialYearAssessment) => {
      // 🛡️ Rollover guard: a financial-year move forward resets the Treasury's and every
      // organisation's current-financial-year totals, so it needs an explicit confirmation first.
      if (assessment.shouldWarn) {
        setPendingSave({ request, assessment });
        return;
      }

      void save(request);
    },
    [save],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 💰Treasury</title>
      </Head>

      <ListPageShell>
        <ListPageHeader
          title={"💰Treasury"}
          description="What Yoma has available to award and to pay out this financial year, and the settings behind it."
        >
          {/* TABBED NAVIGATION */}
          <ListPageTabs
            ariaLabel="Treasury views"
            tabs={[
              {
                key: "treasury_tab_overview",
                label: "Overview",
                href: treasuryHref(null, mockScenario),
                selected: activeTab === null,
              },
              {
                key: "treasury_tab_manage",
                label: "Manage",
                href: treasuryHref(TAB_MANAGE, mockScenario),
                selected: activeTab === TAB_MANAGE,
              },
              {
                key: "treasury_tab_organisations",
                label: "Organisations",
                href: treasuryHref(TAB_ORGANISATIONS, mockScenario),
                selected: activeTab === TAB_ORGANISATIONS,
              },
              {
                key: "treasury_tab_opportunities",
                label: "Opportunities",
                href: treasuryHref(TAB_OPPORTUNITIES, mockScenario),
                selected: activeTab === TAB_OPPORTUNITIES,
              },
            ]}
          />
        </ListPageHeader>

        {/* MAIN CONTENT */}
        <ListPageBody>
          {/* ⚠️⚠️ MOCK SCENARIOS — TEMPORARY DEV AID, DELETE THIS BLOCK BEFORE MERGING ⚠️⚠️ */}
          {process.env.NODE_ENV !== "production" && (
            <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-3">
              <span className="text-xs font-semibold text-amber-900">
                🧪 Mock data (dev only) — the API is not being displayed while a
                scenario is active. Saving still hits the real API.
              </span>
              <div className="flex flex-row flex-wrap gap-1">
                <Link
                  href={treasuryHref(activeTab, null)}
                  scroll={false}
                  className={`badge badge-sm ${mockScenario === null ? "bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-900"}`}
                >
                  live api
                </Link>
                {TREASURY_MOCK_SCENARIO_KEYS.map((scenario) => (
                  <Link
                    key={scenario}
                    href={treasuryHref(activeTab, scenario)}
                    scroll={false}
                    className={`badge badge-sm ${mockScenario === scenario ? "bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-900"}`}
                  >
                    {scenario}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* ⚠️⚠️ end MOCK SCENARIOS ⚠️⚠️ */}

          <ListPageResults
            isLoading={!mockTreasury && isLoading}
            skeletonRows={2}
          >
            {/* ERROR */}
            {!!queryError && !mockTreasury && (
              <div className="shadow-custom flex flex-col items-center gap-4 rounded-lg bg-white p-8">
                <ApiErrors error={queryError} />
                <button
                  type="button"
                  className={`${BTN_PRIMARY} w-40`}
                  onClick={() => void refetch()}
                  disabled={isRefetching}
                >
                  {isRefetching ? "Loading..." : "Try again"}
                </button>
              </div>
            )}

            {/* EMPTY — the API keeps exactly one Treasury row, so this is a data problem */}
            {!queryError && !treasury && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"Treasury unavailable"}
                  description={
                    "We couldn't load the Treasury settings. Please try again, or contact support if this continues."
                  }
                />
              </div>
            )}

            {/* CONTENT */}
            {!!treasury && (
              <div className="flex flex-col gap-4">
                {/* Capacity trouble shows on every tab: it is read on Overview, fixed on Manage,
                    and it is what an admin is looking for when allocating to organisations */}
                <TreasuryCapacityWarnings treasury={treasury} />

                {activeTab === TAB_MANAGE && (
                  <TreasuryManagementForm
                    treasury={treasury}
                    onSubmit={handleFormSubmit}
                    isSubmitting={updateMutation.isPending}
                    serverFieldErrors={serverFieldErrors}
                    serverFormErrors={serverFormErrors}
                  />
                )}

                {/* T2 — the level below Treasury in the hierarchy */}
                {activeTab === TAB_ORGANISATIONS && (
                  <TreasuryOrganisationsTab />
                )}

                {/* T3 — the level below Organisation: where the capacity is being spent */}
                {activeTab === TAB_OPPORTUNITIES && (
                  <TreasuryOpportunitiesTab />
                )}

                {activeTab === null && <TreasuryOverview treasury={treasury} />}
              </div>
            )}
          </ListPageResults>
        </ListPageBody>
      </ListPageShell>

      <TreasuryRolloverConfirmDialog
        isOpen={!!pendingSave}
        assessment={pendingSave?.assessment ?? null}
        isSubmitting={updateMutation.isPending}
        onConfirm={() => {
          if (pendingSave) void save(pendingSave.request);
        }}
        onCancel={() => setPendingSave(null)}
      />
    </>
  );
};

Treasury.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Treasury.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Treasury;
