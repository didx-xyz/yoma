import type { DetailBadgeSection } from "./detailBadges";

/**
 * A header chip asks the sections below to open one and scroll to it (2026-10-12). The header
 * card and `OpportunityDetailSections` are siblings in every host (the public page, the editor's
 * preview), so a window event joins them without threading a callback through each host.
 */
export const DETAIL_SECTION_JUMP = "yoma:detail-section-jump";

export const jumpToDetailSection = (section: DetailBadgeSection): void => {
  window.dispatchEvent(
    new CustomEvent<DetailBadgeSection>(DETAIL_SECTION_JUMP, {
      detail: section,
    }),
  );
};
