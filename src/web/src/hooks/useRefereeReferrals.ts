import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ReferralLinkUsageStatus } from "~/api/models/referrals";
import { searchReferralLinkUsagesAsReferee } from "~/api/services/referrals";

export const REFERRAL_LINK_USAGES_REFEREE_QUERY_KEY =
  "ReferralLinkUsagesReferee";

interface UseRefereeReferralsOptions {
  pageNumber?: number;
  pageSize?: number;
  statuses?: ReferralLinkUsageStatus[] | null;
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export const useRefereeReferrals = ({
  pageNumber = 1,
  pageSize = 10,
  statuses = null,
  enabled = true,
  keepPreviousData: shouldKeepPreviousData = false,
}: UseRefereeReferralsOptions = {}) => {
  return useQuery({
    queryKey: [
      REFERRAL_LINK_USAGES_REFEREE_QUERY_KEY,
      pageNumber,
      pageSize,
      statuses,
    ],
    queryFn: () =>
      searchReferralLinkUsagesAsReferee({
        pageNumber,
        pageSize,
        linkId: null,
        programId: null,
        statuses,
        dateStart: null,
        dateEnd: null,
      }),
    enabled,
    placeholderData: shouldKeepPreviousData ? keepPreviousData : undefined,
  });
};
