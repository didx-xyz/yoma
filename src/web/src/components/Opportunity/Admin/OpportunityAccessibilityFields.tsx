import Select from "react-select";
import type { Accessibility, SelectOption } from "~/api/models/lookups";
import {
  ACCESSIBILITY_SUPPORT_LABELS,
  AccessibilitySupport,
} from "~/api/models/opportunity";
import FormField from "~/components/Common/FormField";
import FormTextArea from "~/components/Common/FormTextArea";
import {
  accommodationOtherIdOf,
  allowsAccommodations,
} from "./opportunityCoreFields";

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility support + accommodations (+ Other description) — core fields.
// Provider-declared accommodations, never a youth's own accessibility needs.
//
// API rules (OpportunityRequestValidatorBase): Yes requires ≥ 1 accommodation;
// AvailableOnRequest allows a selection; No / unspecified carry none. The Other
// accommodation requires a description (max 500); without Other it must be empty.
// This component keeps the three values consistent as the admin edits
// (`reconcileAccessibility`); the host validates and submits them.
// ─────────────────────────────────────────────────────────────────────────────

export const ACCOMMODATION_OTHER_DESCRIPTION_MAX_LENGTH = 500;

export interface OpportunityAccessibilityValue {
  accessibilitySupport: AccessibilitySupport | null;
  accommodations: string[] | null;
  accommodationOtherDescription: string | null;
}

/** Drops accommodations the support status does not allow, and a description without Other. */
export const reconcileAccessibility = (
  value: OpportunityAccessibilityValue,
  otherId: string | null,
): OpportunityAccessibilityValue => {
  const accessibilitySupport = value.accessibilitySupport ?? null;
  const accommodations = allowsAccommodations(accessibilitySupport)
    ? (value.accommodations ?? [])
    : [];
  const hasOther = !!otherId && accommodations.includes(otherId);

  return {
    accessibilitySupport,
    accommodations,
    accommodationOtherDescription: hasOther
      ? (value.accommodationOtherDescription ?? null)
      : null,
  };
};

const SUPPORT_OPTIONS: SelectOption[] = Object.values(AccessibilitySupport).map(
  (support) => ({
    value: support,
    label: ACCESSIBILITY_SUPPORT_LABELS[support],
  }),
);

const SELECT_STYLES = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  placeholder: (base: any) => ({ ...base, color: "#A3A6AF" }),
};

export interface OpportunityAccessibilityFieldsProps {
  value: OpportunityAccessibilityValue;
  /** Accessibility lookup (`useAccessibilityQuery`), including Other. */
  options: Accessibility[] | null | undefined;
  onChange: (next: OpportunityAccessibilityValue) => void;
  errors?: Partial<Record<keyof OpportunityAccessibilityValue, string>>;
  showErrors?: boolean;
  menuPortalTarget?: HTMLElement | null;
}

export const OpportunityAccessibilityFields: React.FC<
  OpportunityAccessibilityFieldsProps
> = ({ value, options, onChange, errors, showErrors, menuPortalTarget }) => {
  const otherId = accommodationOtherIdOf(options);
  const support = value.accessibilitySupport ?? null;
  const selected = value.accommodations ?? [];
  const showAccommodations = allowsAccommodations(support);
  const showOtherDescription =
    showAccommodations && !!otherId && selected.includes(otherId);

  const accommodationOptions: SelectOption[] =
    options?.map((o) => ({ value: o.id, label: o.name })) ?? [];

  const emit = (patch: Partial<OpportunityAccessibilityValue>) =>
    onChange(reconcileAccessibility({ ...value, ...patch }, otherId));

  return (
    <>
      <FormField
        label="Accessibility support"
        subLabel="Does this opportunity provide accommodations for people with disabilities? Leave unspecified if you're not sure."
        showWarningIcon={!!errors?.accessibilitySupport}
        showError={showErrors}
        error={errors?.accessibilitySupport}
      >
        <Select
          instanceId="accessibilitySupport"
          classNames={{
            control: () => "input w-full !border-gray pr-0 pl-2 md:w-1/2",
          }}
          isClearable={true}
          options={SUPPORT_OPTIONS}
          onChange={(val) =>
            emit({
              accessibilitySupport: (val?.value ??
                null) as AccessibilitySupport | null,
            })
          }
          value={SUPPORT_OPTIONS.find((o) => o.value === support) ?? null}
          menuPortalTarget={menuPortalTarget}
          styles={SELECT_STYLES}
          inputId="input_accessibilitySupport" // e2e
          placeholder="Not specified"
        />
      </FormField>

      {showAccommodations && (
        <FormField
          label="Accommodations"
          subLabel={
            support === AccessibilitySupport.Yes
              ? "Which accommodations are provided? Select at least one."
              : "Optionally, which accommodations can be arranged on request?"
          }
          showWarningIcon={!!errors?.accommodations}
          showError={showErrors}
          error={errors?.accommodations}
        >
          <Select
            instanceId="accommodations"
            classNames={{
              control: () =>
                "input w-full !border-gray pr-0 pl-2 h-fit py-1 md:w-1/2",
            }}
            isMulti={true}
            options={accommodationOptions}
            onChange={(val) =>
              emit({ accommodations: val.map((c) => c.value) })
            }
            value={accommodationOptions.filter((c) =>
              selected.includes(c.value),
            )}
            menuPortalTarget={menuPortalTarget}
            styles={SELECT_STYLES}
            inputId="input_accommodations" // e2e
            placeholder="Select accommodations..."
          />
        </FormField>
      )}

      {showOtherDescription && (
        <FormField
          label="Other accommodation"
          subLabel={`Describe the other accommodation (max ${ACCOMMODATION_OTHER_DESCRIPTION_MAX_LENGTH} characters).`}
          showWarningIcon={!!errors?.accommodationOtherDescription}
          showError={showErrors}
          error={errors?.accommodationOtherDescription}
        >
          <FormTextArea
            inputProps={{
              placeholder: "Describe the accommodation...",
              maxLength: ACCOMMODATION_OTHER_DESCRIPTION_MAX_LENGTH,
              value: value.accommodationOtherDescription ?? "",
              onChange: (e) =>
                emit({ accommodationOtherDescription: e.target.value }),
              id: "input_accommodationOtherDescription", // e2e
            }}
          />
        </FormField>
      )}
    </>
  );
};

export default OpportunityAccessibilityFields;
