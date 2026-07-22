import { IoInformationCircleOutline } from "react-icons/io5";
import { type CustomFieldValueItem } from "~/api/models/opportunity";
import { CustomFieldsView } from "~/components/Opportunity/CustomFieldsView";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";

// ─────────────────────────────────────────────────────────────────────────────
// OpportunityCustomFieldsSection (YOM-1244 / YOM-1255)
//
// Opportunity-specific wrapper around the generic read-only CustomFieldsView:
// loads the applicable custom-field definitions for the opportunity type, then
// renders the saved values as a sidebar "Additional details" section.
// Used by the org-admin detail page and the public opportunity details.
// Renders nothing when there are no values to show.
// ─────────────────────────────────────────────────────────────────────────────

export interface OpportunityCustomFieldsSectionProps {
  /** Opportunity type name (enum name, e.g. "Job") used to load the definitions. */
  type: string | null | undefined;
  /** The opportunity's hydrated custom-field values. */
  values: CustomFieldValueItem[] | null | undefined;
  /** Optional whitelist/order of definition keys to show. Omitted → all with a value. */
  fields?: string[];
  /** Gate the definitions fetch (e.g. skip on error/preview). Default true. */
  enabled?: boolean;
  /** Section heading; rendered only when there is at least one value. */
  title?: string;
  className?: string;
}

export const OpportunityCustomFieldsSection: React.FC<
  OpportunityCustomFieldsSectionProps
> = ({
  type,
  values,
  fields,
  enabled = true,
  title = "Additional details",
  className,
}) => {
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    type ? [type] : null,
    { enabled: enabled && !!type },
  );

  return (
    <CustomFieldsView
      title={title}
      icon={<IoInformationCircleOutline className="text-green h-5 w-5" />}
      definitions={definitions}
      values={values}
      fields={fields}
      className={className}
    />
  );
};

export default OpportunityCustomFieldsSection;
