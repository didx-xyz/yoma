import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import type { Organization } from "~/api/models/organisation";
import { getCountries } from "~/api/services/lookups";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";
import FormTextArea from "~/components/Common/FormTextArea";
import type { OrganizationRequestViewModel } from "~/models/organisation";
import {
  validateEmail,
  normalizeAndValidatePhoneNumber,
  normalizeAndValidateEmail,
} from "~/lib/validate";

export interface InputProps {
  formData: OrganizationRequestViewModel | null;
  organisation?: Organization | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgContactEdit: React.FC<InputProps> = ({
  formData,
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => await getCountries(),
  });

  const schema = zod.object({
    streetAddress: zod
      .string()
      .min(1, "Street address is required.")
      .max(500, "Maximum of 500 characters allowed."),
    province: zod
      .string()
      .min(1, "Province is required.")
      .max(255, "Maximum of 255 characters allowed."),
    city: zod
      .string()
      .min(1, "City is required.")
      .max(50, "Maximum of 50 characters allowed."),
    countryId: zod.string().min(1, "Country is required."),
    postalCode: zod
      .string()
      .min(1, "Postal code is required.")
      .max(10, "Maximum of 10 characters allowed."),
    primaryContactName: zod
      .string()
      .min(1, "Primary contact name is required.")
      .max(255, "Maximum of 255 characters allowed."),
    primaryContactEmail: zod
      .string()
      .min(1, "Email is required.")
      .max(320, "Maximum of 320 characters allowed.")
      .transform((val) => {
        // Always normalize the email format first
        return val.replace(/\s/g, "").toLowerCase();
      })
      .refine(
        validateEmail,
        "Please enter a valid email address (name@gmail.com)",
      ),
    primaryContactPhone: zod
      .string()
      .min(1, "Primary contact phone is required.")
      .max(50, "Maximum of 50 characters allowed.")
      .refine(
        (val) => normalizeAndValidatePhoneNumber(val).isValid,
        "Please enter a valid phone number (+27125555555)",
      )
      .transform((val) => {
        const result = normalizeAndValidatePhoneNumber(val);
        return result.normalizedNumber || val; // Fall back to original if normalization fails
      }),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset, trigger, setValue } = form;

  // Function to normalize email on blur
  const normalizeEmailOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;

    const result = normalizeAndValidateEmail(value);
    if (result.isValid && result.normalizedEmail) {
      // Update the form value with the normalized email
      setValue("primaryContactEmail", result.normalizedEmail, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Add function to normalize phone number on blur
  const normalizePhoneNumberOnBlur = (
    event: React.FocusEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (!value) return;

    const result = normalizeAndValidatePhoneNumber(value);
    if (result.isValid && result.normalizedNumber) {
      // Update the form value with the normalized phone number
      setValue("primaryContactPhone", result.normalizedNumber, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...formData,
      });

      // validate the forms on initial load
      // this is needed to show the required field indicators (exclamation icon next to labels) on the first render
      trigger();
    }, 100);
  }, [reset, formData, organisation?.logoURL, trigger]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data);
    },
    [onSubmit],
  );

  return (
    <div className="flex flex-col gap-4">
      {formState.defaultValues && !formState.isValid && (
        <FormRequiredFieldMessage />
      )}

      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex flex-col gap-4"
      >
        <FormField
          label="Primary Contact Name"
          showWarningIcon={!!formState.errors.primaryContactName?.message}
          showError={
            !!formState.touchedFields.primaryContactName ||
            formState.isSubmitted
          }
          error={formState.errors.primaryContactName?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation's primary contact name",
              maxLength: 255,
              ...register("primaryContactName"),
            }}
          />
        </FormField>

        <FormField
          label="Primary Contact Email"
          showWarningIcon={!!formState.errors.primaryContactEmail?.message}
          showError={
            !!formState.touchedFields.primaryContactEmail ||
            formState.isSubmitted
          }
          error={formState.errors.primaryContactEmail?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "email",
              placeholder: "Your organisation's primary contact email",
              maxLength: 320,
              ...register("primaryContactEmail", {
                onBlur: normalizeEmailOnBlur,
              }),
            }}
          />
        </FormField>

        <FormField
          label="Primary Contact Phone"
          showWarningIcon={!!formState.errors.primaryContactPhone?.message}
          showError={
            !!formState.touchedFields.primaryContactPhone ||
            formState.isSubmitted
          }
          error={formState.errors.primaryContactPhone?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "phone",
              placeholder: "Your organisation's primary contact phone",
              maxLength: 50,
              ...register("primaryContactPhone", {
                onBlur: normalizePhoneNumberOnBlur,
              }),
            }}
          />
        </FormField>

        <FormField
          label="Physical address"
          showWarningIcon={!!formState.errors.streetAddress?.message}
          showError={
            !!formState.touchedFields.streetAddress || formState.isSubmitted
          }
          error={formState.errors.streetAddress?.message?.toString()}
        >
          <FormTextArea
            inputProps={{
              placeholder: "Your organisation's physical address",
              maxLength: 500,
              "data-autocomplete": "street-address",
              ...register("streetAddress"),
            }}
          />
        </FormField>

        <FormField
          label="Province"
          showWarningIcon={!!formState.errors.province?.message}
          showError={
            !!formState.touchedFields.province || formState.isSubmitted
          }
          error={formState.errors.province?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation's province/state",
              maxLength: 255,
              "data-autocomplete": "address-level1",
              ...register("province"),
            }}
          />
        </FormField>

        <FormField
          label="City"
          showWarningIcon={!!formState.errors.city?.message}
          showError={!!formState.touchedFields.city || formState.isSubmitted}
          error={formState.errors.city?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation's city/town",
              maxLength: 50,
              "data-autocomplete": "address-level2",
              ...register("city"),
            }}
          />
        </FormField>

        <FormField
          label="Country"
          showWarningIcon={!!formState.errors.countryId?.message}
          showError={
            !!formState.touchedFields.countryId || formState.isSubmitted
          }
          error={formState.errors.countryId?.message?.toString()}
        >
          <select
            className="select border-gray focus:border-gray w-full focus:outline-none"
            {...register("countryId")}
            style={{ fontSize: "1rem" }}
          >
            <option value="">Please select</option>
            {countries?.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Postal code"
          showWarningIcon={!!formState.errors.postalCode?.message}
          showError={
            !!formState.touchedFields.postalCode || formState.isSubmitted
          }
          error={formState.errors.postalCode?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation's postal code/zip",
              maxLength: 10,
              "data-autocomplete": "postal-code",
              ...register("postalCode"),
            }}
          />
        </FormField>

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning md:btn-wide w-1/2 shrink normal-case"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-success md:btn-wide w-1/2 shrink normal-case"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
