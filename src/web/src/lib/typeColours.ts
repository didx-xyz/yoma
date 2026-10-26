import { SchemaType } from "~/api/models/credential";

/**
 * Type colours by Opportunity Type enum name — the one palette for every surface that shows a
 * type: the discovery cards and rows, the YoID opportunity cards, the passport credential cards,
 * the opportunity detail badge, the share preview and the referral task rows, so a type reads
 * the same colour wherever a youth meets it. Colours are the BA Review's, revised for AA white
 * text and a distinct Learning / YoID (2026-10-21, `design/2026-10-21-type-colours.md`), as the
 * `--color-type-*` tokens in `styles/colors.css`:
 *
 * - Every Opportunity Type has its own hue; Other keeps the BA's "Default" slate.
 * - `YoID` is a credential family, not an Opportunity Type: it only ever arrives through
 *   `credentialTypeKey`.
 * - An unknown or future type takes the Default slate, so it degrades to neutral instead of
 *   borrowing another type's colour.
 *
 * Presentation only — nothing may key behaviour off a type name.
 */
interface TypeTone {
  /** Solid fill: the type chip, dot and progress fill, and the card's action button. */
  solid: string;
  /** The card band's tint behind the logo. */
  band: string;
  /** Outline: the list row's action. */
  outline: string;
}

/** The BA's "Default" slate: Other, and any type not in `TYPE_TONES`. */
const DEFAULT_TONE: TypeTone = {
  solid: "bg-type-default text-white",
  band: "bg-type-default/10",
  outline: "border-type-default text-type-default",
};

const TYPE_TONES: Record<string, TypeTone> = {
  Job: {
    solid: "bg-type-job text-white",
    band: "bg-type-job/10",
    outline: "border-type-job text-type-job",
  },
  Event: {
    solid: "bg-type-event text-white",
    band: "bg-type-event/10",
    outline: "border-type-event text-type-event",
  },
  Learning: {
    solid: "bg-type-learning text-white",
    band: "bg-type-learning/10",
    outline: "border-type-learning text-type-learning",
  },
  ImpactAction: {
    solid: "bg-type-impact-action text-white",
    band: "bg-type-impact-action/10",
    outline: "border-type-impact-action text-type-impact-action",
  },
  Entrepreneurship: {
    solid: "bg-type-entrepreneurship text-white",
    band: "bg-type-entrepreneurship/10",
    outline: "border-type-entrepreneurship text-type-entrepreneurship",
  },
  YoID: {
    solid: "bg-type-yoid text-white",
    band: "bg-type-yoid/10",
    outline: "border-type-yoid text-type-yoid",
  },
};

const toneOf = (type: string | null | undefined): TypeTone =>
  (type ? TYPE_TONES[type] : undefined) ?? DEFAULT_TONE;

/** The type chip, and the card's action button in the chip's colour. */
export const typeBadgeClass = (type: string | null | undefined): string =>
  toneOf(type).solid;

export const typeBandClass = (type: string | null | undefined): string =>
  toneOf(type).band;

export const typeOutlineClass = (type: string | null | undefined): string =>
  toneOf(type).outline;

/** The type's `displayName` ("Impact Action"), never the enum name the result carries. */
export const typeLabel = (
  types: { name: string; displayName: string }[],
  type: string,
): string => types.find((t) => t.name === type)?.displayName || type;

/** The palette key for the YoID credential family. */
export const YOID_TYPE = "YoID";

/** The Opportunity Type enum name every untyped credential folds into. */
export const OTHER_TYPE = "Other";

/**
 * The palette key of a wallet credential: the YoID family by `schemaType`, otherwise the
 * API-normalized `typeContext` (YOM-1277). An Opportunity credential without a supported signed
 * type is `Other` — from the youth's side it is an opportunity that is not one of the named
 * types. Never inferred from the schema name or the title.
 */
export const credentialTypeKey = (credential: {
  schemaType: SchemaType | string;
  typeContext: string | null;
}): string =>
  credential.schemaType === SchemaType[SchemaType.YoID] ||
  credential.schemaType === SchemaType.YoID
    ? YOID_TYPE
    : credential.typeContext || OTHER_TYPE;

/**
 * A credential's type label: "YoID Identity" (the BA Review's name for the family), else the
 * type's `displayName`.
 */
export const credentialTypeLabel = (
  types: { name: string; displayName: string }[],
  key: string,
): string => (key === YOID_TYPE ? "YoID Identity" : typeLabel(types, key));
