import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, type FieldValues, useForm } from "react-hook-form";
import CreatableSelect from "react-select/creatable";
import zod from "zod";
import { type OrganizationRequestBase } from "~/api/models/organisation";
import { DELIMETER_PASTE_MULTI } from "~/lib/constants";
import { validateEmail } from "~/lib/validate";

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
      adminEmails: zod.array(zod.string().email()).optional(),
      ssoClientIdInbound: zod.string().optional(),
      ssoClientIdOutbound: zod.string().optional(),
    })
    .superRefine((values, ctx) => {
      // adminEmails is required if addCurrentUserAsAdmin is false
      if (
        !values.addCurrentUserAsAdmin &&
        (values.adminEmails == null || values.adminEmails?.length < 1)
      ) {
        ctx.addIssue({
          message:
            "At least one Admin Additional Email is required if you are not the organisation admin.",
          code: zod.ZodIssueCode.custom,
          path: ["adminEmails"],
        });
      }
    })
    .refine(
      (data) => {
        // validate all items are valid email addresses
        return data.adminEmails?.every((email) => validateEmail(email));
      },
      {
        message:
          "Please enter valid email addresses e.g. name@gmail.com. One or more email address are wrong.",
        path: ["adminEmails"],
      },
    );

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset } = form;

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

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="form-control">
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
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.addCurrentUserAsAdmin.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Add additional admins</span>
          </label>

          <Controller
            name="adminEmails"
            control={form.control}
            defaultValue={organisation?.adminEmails}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render={({ field: { onChange, value } }) => (
              <CreatableSelect
                options={organisation?.adminEmails?.map((val) => ({
                  label: val,
                  value: val,
                }))}
                isMulti
                className="form-control mb-2 w-full"
                onChange={(val) => {
                  // when pasting multiple values, split them by DELIMETER_PASTE_MULTI
                  const emails = val
                    .flatMap((item) => item.value.split(DELIMETER_PASTE_MULTI))
                    .map((email) => email.trim()) // Trim each email
                    .filter((email) => email !== ""); // Filter out empty strings
                  onChange(emails);
                }}
                value={value?.map((val: any) => ({
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
          {formState.errors.adminEmails && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.adminEmails.message}`}
              </span>
            </label>
          )}
        </div>

        {/* BUTTONS */}
        <div className="mt-4 flex flex-row items-center justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning w-1/2 flex-shrink normal-case md:btn-wide"
              onClick={(data) => onCancel(data)}
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
    </>
  );
};
