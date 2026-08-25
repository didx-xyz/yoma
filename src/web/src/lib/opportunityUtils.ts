import type { SyncInfoEntity } from "~/api/models/opportunity";

/**
 * When a pull-synced (externally managed) opportunity arrives from a partner with a title
 * that collides with an existing Yoma opportunity, the API disambiguates it by appending
 * " [<partner external id>]" to the stored title (see OpportunityService.ResolveTitle).
 *
 * That suffix is an internal disambiguator, not part of the partner's title, so it is
 * stripped for display. The stored title is left untouched — never feed a stripped title
 * back into a create/update request.
 */
// NB: no leading \s* — it makes the match ambiguous (super-linear backtracking) and the
// whitespace before the suffix is dropped by the trimEnd() below anyway
const TRAILING_BRACKETS = /\[([^\][]+)\]$/;

/** External ids of the current pull partners (JobJack, Alison) are guids. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strips the partner external id suffix from a pull-synced opportunity title.
 *
 * `syncedInfo` disambiguates three cases:
 * - an object → the opportunity's own sync info; the suffix is matched exactly against the
 *   partner external id, so nothing else is ever stripped
 * - `null` → the opportunity is known not to be pull-synced; the title is returned as-is
 * - omitted → the caller has no opportunity-level sync info (MyOpportunity models only carry
 *   sync info for the submission, not for the opportunity), so fall back to the guid shape
 *   used by the pull partners
 */
export function stripSyncedTitleSuffix(
  title: string,
  syncedInfo?: SyncInfoEntity | null,
): string;
export function stripSyncedTitleSuffix(
  title: string | null | undefined,
  syncedInfo?: SyncInfoEntity | null,
): string | null | undefined;
export function stripSyncedTitleSuffix(
  title: string | null | undefined,
  syncedInfo?: SyncInfoEntity | null,
): string | null | undefined {
  if (!title) return title;

  const match = TRAILING_BRACKETS.exec(title);
  if (!match) return title;

  const candidate = match[1]!.trim();
  const stripped = title.slice(0, match.index).trimEnd();

  // never strip the title away entirely
  if (!stripped) return title;

  // sync info supplied: only strip an exact partner external id match
  if (syncedInfo !== undefined) {
    if (syncedInfo?.syncType !== "Pull") return title;

    return syncedInfo.partners?.some((o) => o.externalId?.trim() === candidate)
      ? stripped
      : title;
  }

  // no sync info available: fall back to the partner external id shape
  return GUID.test(candidate) ? stripped : title;
}
