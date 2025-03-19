import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import type { Organization } from "~/api/models/organisation";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";
import FormTextArea from "~/components/Common/FormTextArea";
import { REGEX_URL_VALIDATION } from "~/lib/constants";
import type { OrganizationRequestViewModel } from "~/models/organisation";
import AvatarUpload from "./AvatarUpload";

export interface InputProps {
  formData: OrganizationRequestViewModel | null;
  organisation?: Organization | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
  onImageChange?: (image: { logo: File | null; logoExisting?: any }) => void;
}

export const OrgInfoEdit: React.FC<InputProps> = ({
  formData,
  //organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
  onImageChange,
}) => {
  const schema = zod
    .object({
      name: zod
        .string()
        .min(1, "Organisation name is required.")
        .max(80, "Maximum of 80 characters allowed."),
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
    })
    .superRefine((values, ctx) => {
      let logoCount = 0;
      if (values.logoExisting) logoCount++;
      if (values.logo) logoCount++;

      if (logoCount < 1) {
        ctx.addIssue({
          message: "Logo is required.",
          code: zod.ZodIssueCode.custom,
          path: ["logo"],
        });
      }
      if (logoCount > 1) {
        ctx.addIssue({
          message: "Only one Logo is required.",
          code: zod.ZodIssueCode.custom,
          path: ["logo"],
        });
      }
    });

  // Initialize useForm with parent's formData as defaultValues.
  const form = useForm({
    mode: "all",
    defaultValues: formData ?? {},
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

  // Reset the form if formData changes (e.g. when navigating back)
  useEffect(() => {
    reset(formData ?? {});
  }, [formData, reset]);

  // Only update the logo fields when they change externally.
  useEffect(() => {
    if (formData?.logo) {
      setValue("logo", formData?.logo as any);
      trigger("logo");
    }
  }, [formData?.logo, setValue, trigger]);

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

        <FormField
          label="Logo"
          showWarningIcon={!!formState.errors.logo?.message}
          showError={!!formState.touchedFields.logo || formState.isSubmitted}
          error={formState.errors.logo?.message?.toString()}
        >
          <div className="flex items-center justify-center pb-4">
            <div className="container mx-auto">
              <AvatarUpload
                onRemoveImageExisting={() => {
                  //setValue("logoExisting", null);
                  setValue("logo", null);
                  trigger("logo");
                  if (onImageChange)
                    onImageChange({ logo: null, logoExisting: null });
                }}
                onUploadComplete={(files) => {
                  const file = files && files.length > 0 ? files[0] : null;
                  //setValue("logoExisting", null);
                  setValue("logo", file);
                  trigger("logo");
                  if (onImageChange) onImageChange({ logo: file });
                }}
                existingImage={(getValues("logo") as any) ?? ""}
                showExisting={!getValues("logo") ? true : false}
              />
            </div>
          </div>
        </FormField>

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
