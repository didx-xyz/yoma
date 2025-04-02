import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import { type OrganizationRequestBase } from "~/api/models/organisation";

export interface InputProps {
  organisation: OrganizationRequestBase | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: (fieldValues: FieldValues) => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgSSOEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const schema = zod.object({
    ssoClientIdInbound: zod.string().optional(),
    ssoClientIdOutbound: zod.string().optional(),
  });

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
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex flex-col gap-2"
    >
      <fieldset className="fieldset">
        <label className="label font-bold">
          <span className="label-text">SSO Client Id Inbound</span>
        </label>
        <p className="text-gray-dark -mt-1 mb-2 ml-1 text-sm">
          Your organisation&apos;s SSO client inbound id
        </p>
        <input
          type="text"
          className="input border-gray focus:border-gray rounded-md focus:outline-none"
          {...register("ssoClientIdInbound")}
          data-autocomplete="sso-client-id-inbound"
        />
        {formState.errors.ssoClientIdInbound && (
          <label className="label font-bold">
            <span className="label-text-alt text-red-500 italic">
              {`${formState.errors.ssoClientIdInbound.message}`}
            </span>
          </label>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <label className="label font-bold">
          <span className="label-text">SSO Client Id Outbound</span>
        </label>
        <p className="text-gray-dark -mt-1 mb-2 ml-1 text-sm">
          Your organisation&apos;s SSO client outbound id
        </p>
        <input
          type="text"
          className="input border-gray focus:border-gray rounded-md focus:outline-none"
          {...register("ssoClientIdOutbound")}
          data-autocomplete="sso-client-id-outbound"
        />
        {formState.errors.ssoClientIdOutbound && (
          <label className="label font-bold">
            <span className="label-text-alt text-red-500 italic">
              {`${formState.errors.ssoClientIdOutbound.message}`}
            </span>
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
  );
};
