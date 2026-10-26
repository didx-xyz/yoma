import Image from "next/image";
import Link from "next/link";
import stamp1 from "public/images/stamp-1.png";
import type { MouseEventHandler } from "react";
import { IoIdCardOutline } from "react-icons/io5";
import { formatNumber } from "~/features/discovery/lib/format";
import {
  PILL_CLASS,
  PILL_COUNT_CLASS,
  PILL_IDLE_CLASS,
  PILL_TOUCH_CLASS,
} from "~/lib/pill";
import {
  OTHER_TYPE,
  YOID_TYPE,
  credentialTypeLabel,
  typeBadgeClass,
} from "~/lib/typeColours";
import NoRowsMessage from "../NoRowsMessage";
import { YOID_TABS } from "./yoidTabs";

/**
 * The summary row's chip: the YoID family keeps its own key and label; the Opportunity row has no
 * per-type split (exact per-type counts are API-gated), so it takes the palette's "Other" tone
 * under the section's own label. The YoID label is a constant branch, so no types list is needed.
 */
const rowChip = (schemaType: string): { key: string; label: string } =>
  schemaType === YOID_TYPE
    ? { key: YOID_TYPE, label: credentialTypeLabel([], YOID_TYPE) }
    : {
        key: OTHER_TYPE,
        label:
          schemaType === "Opportunity"
            ? YOID_TABS.opportunities.label
            : schemaType,
      };

/**
 * The card's rows from the totals query, YoID Identity first (as on the passport page's chip
 * row), each with the passport URL it opens: the YoID chip preselects its type chip there
 * (`?type=YoID`, read by `PassportCredentials`); the Opportunities row spans every opportunity
 * type, so it opens the passport's All view (Jason, 2026-10-22).
 */
export const passportRows = (
  data: { schemaType: string; totalCount: number | null }[],
): {
  schemaType: string;
  key: string;
  label: string;
  count: number;
  href: string;
}[] =>
  [...data]
    .sort(
      (a, b) =>
        Number(b.schemaType === YOID_TYPE) - Number(a.schemaType === YOID_TYPE),
    )
    .map((item) => ({
      schemaType: item.schemaType,
      ...rowChip(item.schemaType),
      count: item.totalCount ?? 0,
      href:
        item.schemaType === YOID_TYPE
          ? `${YOID_TABS.passport.url}?type=${encodeURIComponent(YOID_TYPE)}`
          : YOID_TABS.passport.url,
    }));

export const PassportCard: React.FC<{
  data: { schemaType: string; totalCount: number | null }[];
  /** Called when a pill is followed (the user menu closes its drawer on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ data, onClick }) => {
  // Check if data is null, empty, or if all counts are 0 or null
  const allCountsZero =
    !data ||
    data.length === 0 ||
    data.every((item) => item.totalCount === null || item.totalCount === 0);

  if (allCountsZero) {
    return (
      <NoRowsMessage
        title={""}
        description={
          "Every opportunity you complete adds a verified credential here."
        }
        icon={<IoIdCardOutline aria-hidden className="text-green h-5 w-5" />}
      />
    );
  }

  return (
    <div className="flex grow flex-col gap-3 text-xs md:text-sm">
      {/* One pill per summary row, in the passport page's chip language; each opens the passport.
          The previous design's stamp stencil sits beside them, right-middle, as decoration
          (Jason, 2026-10-22): in the row, not over it, so it never covers a pill. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {passportRows(data).map((row) => (
            <Link
              key={row.schemaType}
              href={row.href}
              onClick={onClick}
              draggable={false}
              className={`${PILL_CLASS} ${PILL_TOUCH_CLASS} ${PILL_IDLE_CLASS}`}
            >
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${typeBadgeClass(row.key)}`}
              />
              {row.label}
              <span className={PILL_COUNT_CLASS}>
                {formatNumber(row.count)}
              </span>
            </Link>
          ))}
        </div>
        <Image
          src={stamp1}
          alt=""
          aria-hidden
          draggable={false}
          className="h-auto w-16 shrink-0 opacity-40 select-none md:w-20"
        />
      </div>
    </div>
  );
};
