import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, type FieldValues, useForm } from "react-hook-form";
import CreatableSelect from "react-select/creatable";
import zod from "zod";
import { type OrganizationRequestBase } from "~/api/models/organisation";
import { DELIMETER_PASTE_MULTI } from "~/lib/constants";
import {
  validateEmail,
  validatePhoneNumber,
  normalizeAndValidateEmail,
  normalizeAndValidatePhoneNumber,
} from "~/lib/validate";

export interface InputProps {
  organisation: OrganizationRequestBase | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: (fieldValues: FieldValues) => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgAdminsEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const schema = zod
    .object({
      addCurrentUserAsAdmin: zod.boolean().optional(),
      admins: zod
        .array(zod.string())
        .optional()
        .transform((items) => {
          // Normalize each email and phone number in the array and remove duplicates
          if (!items) return items;

          return Array.from(
            new Set(
              items.map((item) => {
                // Try to normalize as email
                const emailResult = normalizeAndValidateEmail(item);
                if (emailResult.isValid && emailResult.normalizedEmail) {
                  return emailResult.normalizedEmail;
                }

                // Try to normalize as phone number
                const phoneResult = normalizeAndValidatePhoneNumber(item);
                if (phoneResult.isValid && phoneResult.normalizedNumber) {
                  return phoneResult.normalizedNumber;
                }

                // Return original if can't normalize
                return item;
              }),
            ),
          );
        }),
      ssoClientIdInbound: zod.string().optional(),
      ssoClientIdOutbound: zod.string().optional(),
    })
    .superRefine((data, ctx) => {
      // admins is required if addCurrentUserAsAdmin is false
      if (
        !data.addCurrentUserAsAdmin &&
        (data.admins == null || data.admins?.length < 1)
      ) {
        ctx.addIssue({
          message:
            "At least one user is required if you are not the organisation admin.",
          code: zod.ZodIssueCode.custom,
          path: ["admins"],
        });
      }

      // Check all admins for valid format (email or phone)
      if (data.admins && data.admins.length > 0) {
        const invalidEntries = data.admins.filter(
          (userName: string) =>
            !(validateEmail(userName) || validatePhoneNumber(userName)),
        );

        if (invalidEntries.length > 0) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `Please enter valid email addresses (name@gmail.com) or phone numbers (+27125555555).\n\nInvalid entries: ${invalidEntries.join(", ")}`,
            path: ["admins"],
          });
        }
      }
    });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset, setValue, getValues } =
    form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...organisation,
      });
    }, 100);
  }, [reset, organisation]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data);
    },
    [onSubmit],
  );

  // Helper function to normalize admin values - only normalize valid entries
  const normalizeAdminValues = (values: string[]): string[] => {
    if (!values || values.length === 0) return values;

    return Array.from(
      new Set(
        values.map((value) => {
          // Skip empty or whitespace-only entries
          if (!value || value.trim() === "") {
            return value;
          }

          // Try email normalization first - only apply if valid
          const emailResult = normalizeAndValidateEmail(value);
          if (emailResult.isValid && emailResult.normalizedEmail) {
            return emailResult.normalizedEmail;
          }

          // Try phone normalization - only apply if valid
          const phoneResult = normalizeAndValidatePhoneNumber(value);
          if (phoneResult.isValid && phoneResult.normalizedNumber) {
            return phoneResult.normalizedNumber;
          }

          // Return original if not valid
          return value;
        }),
      ),
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex flex-col gap-2"
      >
        <fieldset className="fieldset">
          <label className="label cursor-pointer font-bold">
            <span className="label-text">I will be the organisation admin</span>
            <input
              type="checkbox"
              className="checkbox-secondary checkbox"
              {...register("addCurrentUserAsAdmin")}
            />
          </label>
          {formState.errors.addCurrentUserAsAdmin && (
            <label className="label font-bold">
              <span className="label-text-alt text-red-500 italic">
                {`${formState.errors.addCurrentUserAsAdmin.message}`}
              </span>
            </label>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <label className="label font-bold">
            <span className="label-text">Add additional admins</span>
          </label>

          <Controller
            name="admins"
            control={form.control}
            defaultValue={organisation?.admins}
            render={({ field: { onChange, value } }) => (
              <CreatableSelect
                options={organisation?.admins?.map((val) => ({
                  label: val,
                  value: val,
                }))}
                isMulti
                className="mb-2 w-full"
                onChange={(val) => {
                  // when pasting multiple values, split them by DELIMETER_PASTE_MULTI
                  const rawValues = val
                    .flatMap((item) => item.value.split(DELIMETER_PASTE_MULTI))
                    .map((email) => email.trim()) // Trim each value
                    .filter((email) => email !== ""); // Filter out empty strings

                  // Only update with normalized values for valid entries
                  if (rawValues.length > 0) {
                    // Normalize the values
                    const normalizedValues = normalizeAdminValues(rawValues);

                    // Update the form with normalized values
                    onChange(normalizedValues);
                  } else {
                    onChange([]);
                  }
                }}
                onBlur={() => {
                  // Normalize existing values on blur
                  const currentValues = getValues("admins") || [];
                  const normalizedValues = normalizeAdminValues(currentValues);
                  setValue("admins", normalizedValues, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                value={(value || []).map((val: string) => ({
                  label: val,
                  value: val,
                }))}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    minHeight: "3rem",
                  }),
                }}
              />
            )}
          />
          {formState.errors.admins && (
            <label className="label font-bold">
              <span
                className="label-text-alt whitespace-break-spaces text-red-500 italic"
                dangerouslySetInnerHTML={{
                  __html:
                    formState.errors.admins.message
                      ?.toString()
                      .replace(/\n/g, "<br/>") || "",
                }}
              />
            </label>
          )}
        </fieldset>

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning md:btn-wide w-1/2 shrink normal-case"
              onClick={(data) => onCancel(data)}
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
    </>
  );
};
