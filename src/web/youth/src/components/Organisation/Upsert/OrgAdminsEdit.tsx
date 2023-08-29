import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import { OrganizationCreateRequest } from "~/api/models/organisation";

export interface InputProps {
  organisation: OrganizationCreateRequest | null;
  onSubmit: (fieldValues: FieldValues) => void;
  onCancel: (fieldValues: FieldValues) => void;
}

export const OrgAdminsEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
}) => {
  const schema = zod.object({
    addCurrentUserAsAdmin: zod.boolean(),
    adminAdditionalEmails: zod.array(zod.string().email()),
  });

  const form = useForm({
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
            {/* <input
                  type="checkbox"
                  className="checkbox mr-2"
                  {...registerStep3("adminAdditionalEmails")}
                /> */}
          </label>
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
            Next
          </button>
        </div>
      </form>
    </>
  );
};
