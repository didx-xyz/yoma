/**
 * Type-badge styling by Opportunity Type enum name, with a neutral fallback so an unknown or
 * future type degrades gracefully instead of breaking the card. Presentation only — nothing else
 * may key behaviour off a type name.
 */
const TYPE_BADGE_CLASSES: Record<string, string> = {
  Job: "bg-purple text-white",
  Learning: "bg-green text-white",
  Event: "bg-orange text-white",
  ImpactAction: "bg-purple-light text-white",
  Other: "bg-gray-dark text-white",
};

export const typeBadgeClass = (type: string): string =>
  TYPE_BADGE_CLASSES[type] ?? "bg-gray-dark text-white";

/** The type's `displayName` ("Impact Action"), never the enum name the result carries. */
export const typeLabel = (
  types: { name: string; displayName: string }[],
  type: string,
): string => types.find((t) => t.name === type)?.displayName || type;

/**
 * Round 7 card pieces (2026-09-30), keyed like the chip so they always agree with it: the logo
 * band's tint, and the type button — solid on the card, outline in the list row — in the chip's
 * own colour.
 */
const TYPE_BAND_CLASSES: Record<string, string> = {
  Job: "bg-purple-tint/60",
  Learning: "bg-green-light",
  Event: "bg-orange/10",
  ImpactAction: "bg-purple-light/15",
  Other: "bg-gray-light",
};

const TYPE_BUTTON_CLASSES: Record<string, string> = {
  Job: "bg-purple text-white",
  Learning: "bg-green text-white",
  Event: "bg-orange text-white",
  ImpactAction: "bg-purple-light text-white",
  Other: "bg-gray-dark text-white",
};

const TYPE_OUTLINE_CLASSES: Record<string, string> = {
  Job: "border-purple text-purple",
  Learning: "border-green text-green",
  Event: "border-orange text-orange",
  ImpactAction: "border-purple-light text-purple-light",
  Other: "border-gray-dark text-gray-dark",
};

export const typeBandClass = (type: string): string =>
  TYPE_BAND_CLASSES[type] ?? "bg-beige";

export const typeButtonClass = (type: string): string =>
  TYPE_BUTTON_CLASSES[type] ?? "bg-gray-dark text-white";

export const typeOutlineClass = (type: string): string =>
  TYPE_OUTLINE_CLASSES[type] ?? "border-gray-dark text-gray-dark";
