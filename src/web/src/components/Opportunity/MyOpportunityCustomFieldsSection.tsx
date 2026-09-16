import { IoInformationCircleOutline } from "react-icons/io5";
import { type CustomFieldValueItem } from "~/api/models/opportunity";
import { CustomFieldsView } from "~/components/Opportunity/CustomFieldsView";
import { useMyOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";

// ─────────────────────────────────────────────────────────────────────────────
// MyOpportunityCustomFieldsSection (YOM-1244 / YOM-1255)
//
// MyOpportunity-specific wrapper around the generic read-only CustomFieldsView:
// loads the applicable completion custom-field definitions for an opportunity
// (type resolved server-side), then renders the hydrated completion values.
// Used by the user's opportunity list cards to surface compact metadata.
// Renders nothing when there are no values to show.
// ─────────────────────────────────────────────────────────────────────────────

export interface MyOpportunityCustomFieldsSectionProps {
  /** Opportunity id used to load the applicable completion definitions. */
  opportunityId: string;
  /** The completion's hydrated custom-field values. */
  values: CustomFieldValueItem[] | null | undefined;
  /** Optional whitelist/order of definition keys to show. Omitted → all with a value. */
  fields?: string[];
  /** Gate the definitions fetch (skip when there are no values). Default true. */
  enabled?: boolean;
  /** Section heading; rendered only when there is at least one value. */
  title?: string;
  className?: string;
}

export const MyOpportunityCustomFieldsSection: React.FC<
  MyOpportunityCustomFieldsSectionProps
> = ({
  opportunityId,
  values,
  fields,
  enabled = true,
  title = "", //"Additional details",
  className,
}) => {
  const { data: definitions } = useMyOpportunityCustomFieldDefinitionsQuery(
    opportunityId,
    { enabled: enabled && !!opportunityId },
  );

  return (
    <CustomFieldsView
      title={title}
      icon={<IoInformationCircleOutline className="text-green h-5 w-5" />}
      definitions={definitions}
      values={values}
      fields={fields}
      className={className}
      hideGrouping={true}
    />
  );
};

export default MyOpportunityCustomFieldsSection;
