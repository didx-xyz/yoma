export interface ReferralStatsNumbers {
  totalReferrals: number;
  completed: number;
  pending: number;
  zltoEarned: number;
}

const REFERRAL_STATS_MOCK_MODE_DEFAULT = false;

export const REFERRAL_STATS_MOCK_STORAGE_KEY = "yoma:referrals:mockStats";

export const getReferralStatsMockMode = (): boolean => {
  const envEnabled = process.env.NEXT_PUBLIC_REFERRALS_MOCK_STATS === "1";

  if (typeof window === "undefined") {
    return envEnabled || REFERRAL_STATS_MOCK_MODE_DEFAULT;
  }

  const stored = window.localStorage.getItem(REFERRAL_STATS_MOCK_STORAGE_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;

  return envEnabled || REFERRAL_STATS_MOCK_MODE_DEFAULT;
};

export const setReferralStatsMockMode = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REFERRAL_STATS_MOCK_STORAGE_KEY,
    enabled ? "1" : "0",
  );
};

export const MOCK_USER_REFERRAL_STATS: ReferralStatsNumbers = {
  totalReferrals: 18,
  completed: 7,
  pending: 3,
  zltoEarned: 120,
};

export const MOCK_LINK_REFERRAL_STATS: ReferralStatsNumbers = {
  totalReferrals: 6,
  completed: 2,
  pending: 1,
  zltoEarned: 40,
};

export const withMockReferralStats = (
  stats: ReferralStatsNumbers,
  kind: "user" | "link",
): ReferralStatsNumbers => {
  if (!getReferralStatsMockMode()) return stats;
  return kind === "user" ? MOCK_USER_REFERRAL_STATS : MOCK_LINK_REFERRAL_STATS;
};
