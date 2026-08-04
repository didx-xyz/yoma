import type { OrganizationRewardPoolField } from "~/api/models/organisation";
import { parseApiError } from "~/lib/apiErrorUtils";

/**
 * Maps `PATCH /organization` reward-pool failures onto the field that caused them.
 *
 * Same constraint as Treasury (see `lib/treasury/serverErrors.ts`): the API discards `PropertyName`
 * from validation failures, so matching on message text is the only way to avoid a generic toast.
 * Two message shapes reach us here:
 *
 *   - the validator's, which interpolates `'{PropertyName}'` — FluentValidation renders that as the
 *     split property name, e.g. *"'Zlto Reward Pool Current Financial Year' must be greater than 0."*
 *     (`OrganizationRequestValidatorBase.cs:72-79`)
 *   - the service's floors, e.g. *"The Zlto reward pool for the current financial year cannot be less
 *     than the cumulative Zlto rewards (250000) already allocated to participants…"*
 *     (`OrganizationService.cs:465-469`)
 *
 * Both contain the reward name followed by "reward pool", which is what the matchers key on.
 *
 * ⚠️ Reward-pool changes are Admin-only server-side (`OrganizationService.cs:460-463`) and a failure
 * there throws `SecurityException` → **401**, not 403 (`ExceptionResponseMiddleware.cs:54-57`). That
 * is not a validation failure, so it falls through to `<ApiErrors />` like any other non-400.
 */

const MATCHERS: { field: OrganizationRewardPoolField; pattern: RegExp }[] = [
  {
    field: "zltoRewardPoolCurrentFinancialYear",
    pattern: /zlto\s+reward\s+pool/i,
  },
  {
    field: "yomaRewardPoolCurrentFinancialYear",
    pattern: /yoma\s+reward\s+pool/i,
  },
];

/** Server property names, for model-binding failures shaped `"PropertyName: message"`. */
const FIELD_BY_PROPERTY_NAME: Record<string, OrganizationRewardPoolField> = {
  zltorewardpoolcurrentfinancialyear: "zltoRewardPoolCurrentFinancialYear",
  yomarewardpoolcurrentfinancialyear: "yomaRewardPoolCurrentFinancialYear",
};

export interface MappedOrganizationRewardErrors {
  fieldErrors: Partial<Record<OrganizationRewardPoolField, string>>;
  /** validation messages that could not be attributed to a pool; show these above the form */
  formErrors: string[];
  /** true when nothing could be extracted — the caller falls back to <ApiErrors /> */
  isUnmapped: boolean;
}

export function mapOrganizationRewardErrors(
  error: unknown,
): MappedOrganizationRewardErrors {
  const { status, errors, message } = parseApiError(error);

  // Only 400s carry validation detail; 401 (including the Admin-only guard) / 404 / 500 do not.
  if (status !== 400) {
    return { fieldErrors: {}, formErrors: [], isUnmapped: true };
  }

  const messages = errors.map((item) => item.message).filter(Boolean);
  if (messages.length === 0 && message) messages.push(message);

  const fieldErrors: Partial<Record<OrganizationRewardPoolField, string>> = {};
  const formErrors: string[] = [];

  for (const raw of messages) {
    let text = raw.trim();
    let field: OrganizationRewardPoolField | undefined;

    const prefixMatch = /^([A-Za-z]+)\s*:\s*(.+)$/s.exec(text);
    if (prefixMatch) {
      const candidate =
        FIELD_BY_PROPERTY_NAME[prefixMatch[1]!.toLowerCase().trim()];
      if (candidate) {
        field = candidate;
        text = prefixMatch[2]!.trim();
      }
    }

    field ??= MATCHERS.find((matcher) => matcher.pattern.test(text))?.field;

    if (field) {
      fieldErrors[field] ??= text;
    } else {
      formErrors.push(text);
    }
  }

  const isUnmapped =
    Object.keys(fieldErrors).length === 0 && formErrors.length === 0;

  return { fieldErrors, formErrors, isUnmapped };
}
