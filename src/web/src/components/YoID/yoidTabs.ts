import type { IconType } from "react-icons";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoFlashOutline,
  IoGridOutline,
  IoHeartOutline,
  IoIdCardOutline,
  IoTimeOutline,
  IoTrophyOutline,
  IoWalletOutline,
} from "react-icons/io5";
import type { UserSkillInfo } from "~/api/models/user";
import { WalletCreationStatus, type UserProfile } from "~/api/models/user";
import { formatNumber } from "~/features/discovery/lib/format";
import { formatZlto } from "~/lib/format/rewards";

export interface YoIDTab {
  label: string;
  /** The tab's tooltip. */
  description: string;
  /** One line under the overview tile's header: what the section holds. */
  blurb: string;
  url: string;
  icon: IconType;
  /** `path`: the URL path, without its query string or hash. */
  isCurrent: (path: string) => boolean;
  /**
   * The hero's rotating line while this tab is current: what the youth can do next, with their
   * own numbers where the profile has them (`hints`; Jason, 2026-10-22). Never a greeting or a
   * request. Each line stays under ~40 characters so it fits a single line at 390
   * (`AnimatedText` reserves one).
   */
  sentences: (profile: UserProfile | null | undefined) => string[];
}

const plural = (n: number, one: string, many: string): string =>
  `${formatNumber(n)} ${n === 1 ? one : many}`;

/** The balance, once the reward wallet exists: a pending wallet has no figure to quote. */
const zltoAvailable = (
  profile: UserProfile | null | undefined,
): number | null =>
  profile?.zlto?.walletCreationStatus === WalletCreationStatus.Created
    ? (profile.zlto.available ?? null)
    : null;

/**
 * The Wallet section's closed-row preview, on the overview and in the user-menu drawer: the
 * ledger's three figures, once the reward wallet exists and the provider is reachable (Jason,
 * 2026-10-22). Pending is `pendingRewards`, the ledger's "+Pending rewards" movement, and the
 * profile always carries it — so a wallet still being set up quotes it too, as the wallet page's
 * notice does, instead of a bare label.
 */
export const walletPreview = (
  profile: UserProfile | null | undefined,
): string => {
  const zlto = profile?.zlto;
  if (!zlto) return "Your ZLTO rewards";
  if (zlto.walletCreationStatus !== WalletCreationStatus.Created)
    return `Wallet being set up · ${formatZlto(zlto.pendingRewards)} pending`;
  if (zlto.available == null)
    return `Balance unavailable · ${formatZlto(zlto.pendingRewards)} pending`;
  return `${formatZlto(zlto.available)} available · ${formatZlto(zlto.pendingRewards)} pending · ${formatZlto(zlto.total)} total`;
};

/** The lines that apply: a hint is null when the youth has nothing of that kind. */
const lines = (...hints: (string | null)[]): string[] =>
  hints.filter((hint): hint is string => hint !== null);

/**
 * The hero's rotating hints, from the profile alone (Jason, 2026-10-22): each names something
 * the youth can do next, with the number they already have where there is one — no greetings,
 * no section blurbs. Each tab picks the ones that belong to it, in its own order. Every line
 * stays under ~40 characters (`AnimatedText` reserves one at 390).
 */
const hints = (profile: UserProfile | null | undefined) => {
  const available = zltoAvailable(profile);
  const pendingZlto = profile?.zlto?.pendingRewards ?? 0;
  const pending = profile?.opportunityCountPending ?? 0;
  const saved = profile?.opportunityCountSaved ?? 0;
  const completed = profile?.opportunityCountCompleted ?? 0;
  return {
    spend: available ? `${formatNumber(available)} ZLTO ready to spend` : null,
    pendingZlto: pendingZlto
      ? `${formatNumber(pendingZlto)} ZLTO on its way`
      : null,
    pending: pending
      ? `${plural(pending, "opportunity", "opportunities")} pending verification`
      : null,
    saved: saved
      ? `${plural(saved, "opportunity", "opportunities")} saved to pick up`
      : null,
    /** Something to show for the completions, or the way to the first one. */
    share: completed
      ? "Open Passport to see your credentials"
      : "Complete an opportunity to earn ZLTO",
    find: "Find a new opportunity",
  };
};

/**
 * The Opportunities section's closed-row preview: the four sub-tab counts the profile already
 * carries, so it shows before the summary query has answered. Nothing until the profile has.
 */
export const opportunitiesPreview = (
  profile: UserProfile | null | undefined,
): string | null =>
  profile
    ? YOID_OPPORTUNITY_TABS.map(
        (tab) =>
          `${formatNumber(profile[tab.count])} ${tab.label.toLowerCase()}`,
      ).join(" · ")
    : null;

/**
 * The Passport section's closed-row preview: one count per credential family from the totals
 * the section already fetches ("1 YoID Identity · 129 Opportunities"); nothing until they have
 * loaded, and "Your verified credentials" for an empty wallet.
 */
export const passportPreview = (
  rows: { label: string; count: number }[] | undefined,
): string | null => {
  if (!rows) return null;
  const some = rows.filter((row) => row.count > 0);
  return some.length
    ? some.map((row) => `${formatNumber(row.count)} ${row.label}`).join(" · ")
    : "Your verified credentials";
};

/** How many skill names the Skills section's closed row quotes before "…". */
const PREVIEW_SKILLS = 3;

/**
 * The Skills section's closed-row preview: the first few names (the count sits beside the
 * title); nothing until the skills have loaded.
 */
export const skillsPreview = (
  skills: UserSkillInfo[] | undefined,
): string | null => {
  if (!skills) return null;
  if (!skills.length) return "Skills you've earned";
  const names = skills.slice(0, PREVIEW_SKILLS).map((skill) => skill.name);
  return skills.length > PREVIEW_SKILLS
    ? `${names.join(" · ")} …`
    : names.join(" · ");
};

/**
 * The Yo-ID sections, in tab order: the hero tabs, the breadcrumbs, the overview tile headers and
 * the hero's welcome line read their label, icon and copy from here (io5 icons, as discovery;
 * Jason, 2026-10-20).
 */
export const YOID_TABS = {
  overview: {
    label: "Overview",
    description: "Overview of your Yo-ID",
    blurb: "Your wallet, passport, skills and opportunities in one place.",
    url: "/yoid",
    icon: IoGridOutline,
    isCurrent: (path) => path === "/yoid",
    sentences: (profile) => {
      const h = hints(profile);
      return lines(h.spend, h.pendingZlto, h.pending, h.saved, h.share, h.find);
    },
  },
  wallet: {
    label: "Wallet",
    description: "My digital wallet",
    blurb:
      "ZLTO you earn by completing opportunities — spend it in the marketplace.",
    url: "/yoid/wallet",
    icon: IoWalletOutline,
    isCurrent: (path) => path.startsWith("/yoid/wallet"),
    sentences: (profile) => {
      const h = hints(profile);
      return lines(
        h.spend,
        h.pendingZlto,
        h.spend ? "Spend ZLTO in the marketplace" : h.share,
        h.find,
      );
    },
  },
  passport: {
    label: "Passport",
    description: "My digital credentials",
    blurb: "Verified credentials for every opportunity you complete.",
    url: "/yoid/passport",
    icon: IoIdCardOutline,
    isCurrent: (path) => path.startsWith("/yoid/passport"),
    sentences: (profile) => {
      const h = hints(profile);
      return lines(
        h.share,
        "Open a credential to see what it proves",
        h.pending,
        h.find,
      );
    },
  },
  opportunities: {
    label: "Opportunities",
    description: "Completed, pending, declined & saved opportunities",
    blurb: "What you've completed, submitted, had declined or saved for later.",
    url: "/yoid/opportunities/completed",
    icon: IoTrophyOutline,
    isCurrent: (path) => path.startsWith("/yoid/opportunities"),
    sentences: (profile) => {
      const h = hints(profile);
      return lines(h.pending, h.saved, "Add a completed opportunity", h.find);
    },
  },
  skills: {
    label: "Skills",
    description: "Skills gained through opportunities",
    blurb: "Skills you've earned by completing opportunities.",
    url: "/yoid/skills",
    icon: IoFlashOutline,
    isCurrent: (path) => path.startsWith("/yoid/skills"),
    sentences: (profile) => {
      const h = hints(profile);
      return lines(
        "Each completion can add a skill",
        h.pending,
        h.saved,
        h.find,
      );
    },
  },
} satisfies Record<string, YoIDTab>;

/** The tab the path belongs to, else the overview. */
export const currentYoIDTab = (path: string): YoIDTab =>
  Object.values(YOID_TABS).find((tab) => tab.isCurrent(path)) ??
  YOID_TABS.overview;

/**
 * The Opportunities sub-tabs, in order: the sub-pages' pills and the overview's summary circles
 * read their label, icon and profile count from here. `count` is the profile field that holds
 * the tab's number.
 */
export const YOID_OPPORTUNITY_TABS = [
  {
    label: "Completed",
    description: "Opportunities that you have completed",
    url: "/yoid/opportunities/completed",
    icon: IoCheckmarkCircleOutline,
    count: "opportunityCountCompleted",
  },
  {
    label: "Pending",
    description: "Opportunities that are pending verification",
    url: "/yoid/opportunities/pending",
    icon: IoTimeOutline,
    count: "opportunityCountPending",
  },
  {
    label: "Declined",
    description: "Opportunities that have been declined",
    url: "/yoid/opportunities/declined",
    icon: IoCloseCircleOutline,
    count: "opportunityCountRejected",
  },
  {
    label: "Saved",
    description: "Opportunities that you have saved",
    url: "/yoid/opportunities/saved",
    icon: IoHeartOutline,
    count: "opportunityCountSaved",
  },
] as const satisfies readonly {
  label: string;
  description: string;
  url: string;
  icon: IconType;
  count: keyof UserProfile;
}[];
