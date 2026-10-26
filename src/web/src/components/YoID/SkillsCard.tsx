import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { UserSkillInfo } from "~/api/models/user";
import { EmptyState, FIND_OPPORTUNITIES } from "./EmptyState";

/** The tile shows this many skills; the rest are behind the section's "Open Skills →". */
const SHOWN_SKILLS = 8;

/** The detail page's chip (`ChipList`): never wider than the tile; a long name wraps inside the pill. */
const CHIP_CLASS =
  "bg-green-light text-green inline-flex max-w-full items-center rounded-full px-3 py-[5px] text-[13px] font-bold";

/**
 * The first skills as chips. No "Show all N →" of its own: the section's "Open Skills →" leads
 * to the same page (Jason, 2026-10-22).
 */
export const SkillsCard: React.FC<{
  data: UserSkillInfo[];
  /** Called when the empty state's link is followed (the drawer closes on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ data, onClick }) => {
  if (!data?.length) {
    return (
      <EmptyState
        title="No skills yet"
        description="Each opportunity you complete adds the skills it taught you."
        action={FIND_OPPORTUNITIES}
        onClick={onClick}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {data.slice(0, SHOWN_SKILLS).map((item) =>
        item.infoURL ? (
          <Link key={item.id} href={item.infoURL} className={CHIP_CLASS}>
            {item.name}
          </Link>
        ) : (
          <span key={item.id} className={CHIP_CLASS}>
            {item.name}
          </span>
        ),
      )}
    </div>
  );
};
