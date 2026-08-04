import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  OrganizationStatus,
  type Organization,
  type OrganizationInfoAdmin,
  type OrganizationRewardPoolField,
  type OrganizationRewardPools,
  type OrganizationSearchFilter,
  type OrganizationSearchResults,
} from "~/api/models/organisation";
import {
  getOrganisationById,
  getOrganisations,
} from "~/api/services/organisations";
import { BTN_SECONDARY } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { ListPagePagination } from "~/components/Common/ListPage/ListPageResults";
import { ListPageSearchToolbar } from "~/components/Common/ListPage/ListPageSearchToolbar";
import { ModalBody, ModalHeader } from "~/components/Common/ModalChrome";
import OrganizationRewardPoolsForm from "~/components/Organisation/Rewards/OrganizationRewardPoolsForm";
import OrganizationRewardStats from "~/components/Organisation/Rewards/OrganizationRewardStats";
import OrganizationRewardSummaryRow from "~/components/Organisation/Rewards/OrganizationRewardSummaryRow";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import {
  ORGANIZATION_REWARD_QUERY_KEYS,
  useOrganizationRewardPoolsMutation,
} from "~/hooks/useOrganizationRewardMutations";
import { PAGE_SIZE } from "~/lib/constants";
import { mapOrganizationRewardErrors } from "~/lib/organisation/serverErrors";

/**
 * Treasury → Organisations: every organisation's reward capacity for this financial year, in one
 * place, with the same edit affordance as the organisation's own page.
 *
 * This is the level below Treasury in the hierarchy (Treasury → Organisation → Opportunity), so an
 * admin allocating capacity can see where it has gone without hopping between organisation pages.
 *
 * Built entirely from T2's prop-driven components — `OrganizationRewardSummaryRow` per row,
 * `OrganizationRewardStats` + `OrganizationRewardPoolsForm` in the edit dialog — so a figure shown
 * here is identical to the same figure on `/organisations/[id]`.
 *
 * NB: search and paging are component state rather than querystring params, unlike the admin list
 * pages. The `?tab=` param already owns this url, and a tab panel does not need its own shareable
 * filter state; the shared search/pagination *components* are still used so it looks and behaves the
 * same.
 */

/** Editing needs the full `Organization` — `PATCH /organization` is a full replacement. */
interface EditTarget {
  id: string;
  name: string;
}

export const TreasuryOrganisationsTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Partial<Record<OrganizationRewardPoolField, string>> | undefined
  >();
  const [serverFormErrors, setServerFormErrors] = useState<string[]>([]);

  const searchFilter = useMemo<OrganizationSearchFilter>(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      valueContains: search.length > 2 ? search : null,
      // Only active organisations can award anything, so those are the ones worth allocating to.
      statuses: [OrganizationStatus.Active.toString()],
      organizations: null,
    }),
    [pageNumber, search],
  );

  const {
    data: results,
    isLoading,
    error: queryError,
    isPlaceholderData: isShowingPreviousResults,
  } = useQuery<OrganizationSearchResults>({
    // Under the shared "Organisations" prefix, so saving a pool invalidates this list too.
    queryKey: ORGANIZATION_REWARD_QUERY_KEYS.list(
      `treasury_${searchFilter.valueContains ?? ""}_${pageNumber}`,
    ),
    queryFn: () => getOrganisations(searchFilter),
    placeholderData: keepPreviousData,
  });

  /** The full organisation for the row being edited — the search only returns the info variant. */
  const {
    data: editOrganisation,
    isLoading: isLoadingEditOrganisation,
    error: editOrganisationError,
  } = useQuery<Organization>({
    queryKey: ORGANIZATION_REWARD_QUERY_KEYS.detail(editTarget?.id ?? ""),
    queryFn: () => getOrganisationById(editTarget!.id),
    enabled: !!editTarget,
  });

  const poolsMutation = useOrganizationRewardPoolsMutation();

  const closeEditor = useCallback(() => {
    setEditTarget(null);
    setServerFieldErrors(undefined);
    setServerFormErrors([]);
  }, []);

  const onSubmitPools = useCallback(
    async (pools: OrganizationRewardPools) => {
      if (!editOrganisation) return;

      setServerFieldErrors(undefined);
      setServerFormErrors([]);

      try {
        await poolsMutation.mutateAsync({
          organization: editOrganisation,
          pools,
        });

        toast.success(`Reward pools updated for ${editOrganisation.name}`, {
          autoClose: 2000,
        });
        closeEditor();
      } catch (error) {
        const mapped = mapOrganizationRewardErrors(error);

        if (mapped.isUnmapped) {
          toast(<ApiErrors error={error} />, {
            type: "error",
            toastId: "treasury-org-pools-error",
            autoClose: false,
            icon: false,
          });
          return;
        }

        setServerFieldErrors({ ...mapped.fieldErrors });
        setServerFormErrors(mapped.formErrors);
      }
    },
    [editOrganisation, poolsMutation, closeEditor],
  );

  const items: OrganizationInfoAdmin[] = results?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="shadow-custom flex flex-col gap-1 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">Organisations</h5>
        <p className="text-gray-dark text-sm">
          What each organisation can award this financial year, and what is
          left. Organisations draw from the Treasury pools, and their
          opportunities draw from them.
        </p>
      </div>

      <ListPageSearchToolbar
        defaultValue={search}
        placeholder="Search organisations..."
        onSearch={(query) => {
          setSearch(query);
          setPageNumber(1);
        }}
      />

      {/* ERROR */}
      {!!queryError && (
        <div className="shadow-custom flex flex-col items-center rounded-lg bg-white p-8">
          <ApiErrors error={queryError} />
        </div>
      )}

      {/* LOADING — first load only */}
      {isLoading && !queryError && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8">
          <LoadingSkeleton rows={3} />
        </div>
      )}

      {/* NO ROWS */}
      {!isLoading && !queryError && items.length === 0 && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
          <NoRowsMessage
            title={"No organisations found"}
            description={
              search
                ? "Please try refining your search."
                : "Active organisations will show here once they exist."
            }
          />
        </div>
      )}

      {/* RESULTS */}
      {!isLoading && !queryError && items.length > 0 && (
        <div
          className={`flex flex-col gap-3 transition-opacity ${isShowingPreviousResults ? "opacity-50" : ""}`}
        >
          {items.map((organisation) => (
            <OrganizationRewardSummaryRow
              key={organisation.id}
              name={organisation.name}
              logoURL={organisation.logoURL}
              figures={organisation}
              action={
                <button
                  type="button"
                  className={`${BTN_SECONDARY} !min-w-0 !px-3`}
                  onClick={() =>
                    setEditTarget({
                      id: organisation.id,
                      name: organisation.name,
                    })
                  }
                >
                  Edit pools
                </button>
              }
            />
          ))}

          <ListPagePagination
            currentPage={pageNumber}
            totalItems={results?.totalCount ?? 0}
            pageSize={PAGE_SIZE}
            onClick={(page) => setPageNumber(page)}
            isShowingPreviousResults={isShowingPreviousResults}
          />
        </div>
      )}

      {/* EDIT DIALOG — the same stats and the same form as the organisation's own page */}
      <CustomModal
        isOpen={!!editTarget}
        shouldCloseOnOverlayClick={!poolsMutation.isPending}
        onRequestClose={closeEditor}
        className="md:max-h-[90vh] md:max-w-[720px]"
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <ModalHeader
            title={editTarget?.name ?? "Reward pools"}
            onClose={poolsMutation.isPending ? undefined : closeEditor}
          />

          <ModalBody className="items-stretch bg-white">
            {isLoadingEditOrganisation && <LoadingSkeleton rows={2} />}

            {!!editOrganisationError && (
              <ApiErrors error={editOrganisationError} />
            )}

            {!!editOrganisation && (
              <div className="flex flex-col gap-4">
                <FormMessage messageType={FormMessageType.Info}>
                  These pools cover the whole organisation for this financial
                  year. Awarded and remaining figures are calculated by the
                  system.
                </FormMessage>

                <OrganizationRewardStats
                  figures={editOrganisation}
                  columns={2}
                />

                <OrganizationRewardPoolsForm
                  figures={editOrganisation}
                  onSubmit={onSubmitPools}
                  isSubmitting={poolsMutation.isPending}
                  serverFieldErrors={serverFieldErrors}
                  serverFormErrors={serverFormErrors}
                  submitLabel="Save pools"
                  secondaryAction={{ label: "Cancel", onClick: closeEditor }}
                />
              </div>
            )}
          </ModalBody>
        </div>
      </CustomModal>
    </div>
  );
};

export default TreasuryOrganisationsTab;
