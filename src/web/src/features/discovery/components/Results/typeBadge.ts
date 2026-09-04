/**
 * Type-badge styling by Opportunity Type enum name, with a neutral fallback so an unknown or
 * future type degrades gracefully instead of breaking the card. Presentation only — nothing else
 * may key behaviour off a type name.
 */
const TYPE_BADGE_CLASSES: Record<string, string> = {
  Job: "bg-purple text-white",
  Learning: "bg-green text-white",
  Event: "bg-orange text-white",
  Task: "bg-purple-light text-white",
  Other: "bg-gray-dark text-white",
};

export const typeBadgeClass = (type: string): string =>
  TYPE_BADGE_CLASSES[type] ?? "bg-gray-dark text-white";
