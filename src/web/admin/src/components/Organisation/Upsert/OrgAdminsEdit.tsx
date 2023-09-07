/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, FieldValues, useForm } from "react-hook-form";
import CreatableSelect from "react-select/creatable";
import zod from "zod";
import { type OrganizationCreateRequest } from "~/api/models/organisation";

export interface InputProps {
  organisation: OrganizationCreateRequest | null;
  onSubmit: (fieldValues: FieldValues) => void;
  onCancel: (fieldValues: FieldValues) => void;
}

function validateEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export const OrgAdminsEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
}) => {
  const schema = zod
    .object({
      addCurrentUserAsAdmin: zod.boolean().optional(),
      adminAdditionalEmails: zod.array(zod.string().email()).optional(),
    })
    .nonstrict()

    .superRefine((values, ctx) => {
      // adminAdditionalEmails is required if addCurrentUserAsAdmin is false
      if (
        !values.addCurrentUserAsAdmin &&
        (values.adminAdditionalEmails == null ||
          values.adminAdditionalEmails?.length < 1)
      ) {
        ctx.addIssue({
          message:
            "At least one Admin Additional Email is required if you are not the organisation admin.",
          code: zod.ZodIssueCode.custom,
          path: ["adminAdditionalEmails"],
        });
      }
    })
    .refine(
      (data) => {
        // validate all items are valid email addresses
        return data.adminAdditionalEmails?.every((email) =>
          validateEmail(email),
        );
      },
      {
        message:
          "Please enter valid email addresses e.g. name@gmail.com. One or more email address are wrong.",
        path: ["adminAdditionalEmails"],
      },
    );

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const {
    register: register,
    handleSubmit: handleSubmit,
    formState: { errors: errors },
    getValues: getValues,
    reset: reset,
  } = form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...organisation,
      });
    }, 100);
  }, [reset]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      onSubmit(data);
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
              className="checkbox-primary checkbox"
              {...register("addCurrentUserAsAdmin")}
            />
          </label>
          {errors.addCurrentUserAsAdmin && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.addCurrentUserAsAdmin.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Add additional admins</span>
          </label>

          <Controller
            name="adminAdditionalEmails"
            control={form.control}
            defaultValue={organisation?.adminAdditionalEmails}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render={({ field: { onChange, value } }) => (
              <CreatableSelect
                options={organisation?.adminAdditionalEmails?.map((val) => ({
                  label: val,
                  value: val,
                }))}
                isMulti
                className="form-control w-full"
                // eslint-disable-next-line
                onChange={(val) => onChange(val.map((c) => c.value))}
                value={value?.map((val: any) => ({
                  label: val,
                  value: val,
                }))}
              />
            )}
          />
          {errors.adminAdditionalEmails && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.adminAdditionalEmails.message}`}
              </span>
            </label>
          )}
        </div>

        {/* BUTTONS */}
        <div className="my-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="btn btn-warning btn-sm flex-grow"
            onClick={(data) => onCancel(data)}
          >
            Back
          </button>
          <button type="submit" className="btn btn-success btn-sm flex-grow">
            Submit
          </button>
        </div>
      </form>
    </>
  );
};
/* eslint-enable */
