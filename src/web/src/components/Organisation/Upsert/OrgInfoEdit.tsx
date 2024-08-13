import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import type {
  Organization,
  OrganizationRequestBase,
} from "~/api/models/organisation";
import { REGEX_URL_VALIDATION } from "~/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { getCountries } from "~/api/services/lookups";
import AvatarUpload from "./AvatarUpload";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormTextArea from "~/components/Common/FormTextArea";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { OrganizationRequestViewModel } from "~/models/organisation";

export interface InputProps {
  formData: OrganizationRequestViewModel | null;
  organisation?: Organization | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgInfoEdit: React.FC<InputProps> = ({
  formData,
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  //const [logoFiles, setLogoFiles] = useState(false);

  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => await getCountries(),
  });

  const schema = zod
    .object({
      name: zod
        .string()
        .min(1, "Organisation name is required.")
        .max(80, "Maximum of 80 characters allowed."),
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
      websiteURL: zod
        .string()
        .regex(
          REGEX_URL_VALIDATION,
          "Please enter a valid URL - example.com | www.example.com | https://www.example.com",
        )
        .optional(),
      logo: zod.any().optional(),
      logoExisting: zod.any().optional(),
      tagline: zod
        .string()
        .max(160, "Maximum of 160 characters allowed.")
        .nullish()
        .optional(),
      biography: zod
        .string()
        .max(480, "Maximum of 480 characters allowed.")
        .nullish()
        .optional(),
      primaryContactName: zod
        .string()
        .min(1, "Primary contact name is required.")
        .max(255, "Maximum of 255 characters allowed."),
      primaryContactEmail: zod
        .string()
        .min(1, "Email is required.")
        .max(320, "Maximum of 320 characters allowed.")
        .email("Invalid email address."),
      primaryContactPhone: zod
        .string()
        .min(1, "Primary contact phone is required.")
        .max(50, "Maximum of 50 characters allowed."),
    })
    .superRefine((values, ctx) => {
      let logoCount = 0;
      if (values.logoExisting) logoCount++;
      if (values.logo) logoCount++;

      // logo is required
      if (logoCount < 1) {
        ctx.addIssue({
          message: "Logo is required.",
          code: zod.ZodIssueCode.custom,
          path: ["logo"],
        });
      }
      // only one logo required
      if (logoCount > 1) {
        ctx.addIssue({
          message: "Only one Logo is required.",
          code: zod.ZodIssueCode.custom,
          path: ["logo"],
        });
      }
    });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const {
    register,
    handleSubmit,
    formState,
    setValue,
    getValues,
    reset,
    trigger,
  } = form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...formData,
        logoExisting: organisation?.logoURL,
      });

      // validate the forms on initial load
      // this is needed to show the required field indicators (exclamation icon next to labels) on the first render
      trigger();
    }, 100);
  }, [reset, formData, organisation?.logoURL]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data);
    },
    [onSubmit],
  );

  return (
    <div className="flex flex-col gap-4">
      {!formState.isValid && <FormRequiredFieldMessage />}

      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-4"
      >
        <FormField
          label="Organisation name"
          showWarningIcon={!!formState.errors.name?.message}
          showError={!!formState.touchedFields.name || formState.isSubmitted}
          error={formState.errors.name?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation name",
              maxLength: 80,
              "data-autocomplete": "organization",
              ...register("name"),
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
            className="select select-bordered border-gray focus:border-gray focus:outline-none"
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

        <FormField
          label="Organisation website URL"
          showWarningIcon={!!formState.errors.websiteURL?.message}
          showError={
            !!formState.touchedFields.websiteURL || formState.isSubmitted
          }
          error={formState.errors.websiteURL?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "www.website.com",
              maxLength: 2048,
              "data-autocomplete": "url",
              ...register("websiteURL"),
            }}
          />
        </FormField>

        <FormField
          label="Logo"
          showWarningIcon={!!formState.errors.logo?.message}
          showError={!!formState.touchedFields.logo || formState.isSubmitted}
          error={formState.errors.logo?.message?.toString()}
        >
          <div className="flex items-center justify-center pb-4">
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}

            {/* UPLOAD IMAGE */}
            <div className="container mx-auto">
              <AvatarUpload
                onRemoveImageExisting={() => {
                  setValue("logoExisting", null);
                  setValue("logo", null);
                  trigger("logo");
                }}
                onUploadComplete={(files) => {
                  setValue("logoExisting", null);
                  setValue("logo", files && files.length > 0 ? files[0] : null);
                  trigger("logo");
                }}
                existingImage={getValues("logoExisting") ?? ""}
                showExisting={
                  !getValues("logo") && getValues("logoExisting") ? true : false
                }
              />
            </div>
          </div>
        </FormField>

        <FormField
          label="Organisation tagline"
          showWarningIcon={!!formState.errors.tagline?.message}
          showError={!!formState.touchedFields.tagline || formState.isSubmitted}
          error={formState.errors.tagline?.message?.toString()}
        >
          <FormInput
            inputProps={{
              type: "text",
              placeholder: "Your organisation tagline",
              maxLength: 160,
              ...register("tagline"),
            }}
          />
        </FormField>

        <FormField
          label="Organisation biography"
          showWarningIcon={!!formState.errors.biography?.message}
          showError={
            !!formState.touchedFields.biography || formState.isSubmitted
          }
          error={formState.errors.biography?.message?.toString()}
        >
          <FormTextArea
            inputProps={{
              placeholder: "Your organisation biography",
              maxLength: 480,
              ...register("biography"),
            }}
          />
        </FormField>

        <div className="-mb-2 font-semibold">Primary Contact Details</div>

        <FormMessage messageType={FormMessageType.Info}>
          These details will be shared to partners and Youth to enhance
          discovery and contractibility if settings are enabled.
        </FormMessage>

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
              ...register("primaryContactEmail"),
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
              ...register("primaryContactPhone"),
            }}
          />
        </FormField>

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning w-1/2 flex-shrink normal-case md:btn-wide"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-success w-1/2 flex-shrink normal-case md:btn-wide"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
