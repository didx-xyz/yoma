import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import { type OrganizationRequestBase } from "~/api/models/organisation";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";

export interface InputProps {
  organisation: OrganizationRequestBase | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: (fieldValues: FieldValues) => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgRewardsEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const schema = zod.object({
    zltoRewardPool: zod.string().nullable().optional(),
    yomaRewardPool: zod.string().nullable().optional(),
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
      <FormField
        label="Zlto Reward Pool"
        showWarningIcon={!!formState.errors.zltoRewardPool?.message}
        showError={
          !!formState.touchedFields.zltoRewardPool || formState.isSubmitted
        }
        error={formState.errors.zltoRewardPool?.message?.toString()}
        tooltip="Represents the total amount of rewards that an organization or opportunity has allocated to be distributed. It is the maximum amount that can be awarded as rewards to participants"
      >
        <FormInput
          inputProps={{
            type: "number",
            placeholder: "Your organisation's Zlto reward pool",
            "data-autocomplete": "zlto-reward-pool",
            step: "1",
            ...register("zltoRewardPool"),
          }}
        />
      </FormField>

      {/* deprecated for now */}
      {/* <FormField
        label="Yoma Reward Pool"
        showWarningIcon={!!formState.errors.yomaRewardPool?.message}
        showError={
          !!formState.touchedFields.yomaRewardPool || formState.isSubmitted
        }
        error={formState.errors.yomaRewardPool?.message?.toString()}
      >
        <FormInput
          inputProps={{
            type: "number",
            placeholder: "Your organisation's Yoma reward pool",
            "data-autocomplete": "yoma-reward-pool",
            step: "1",
            ...register("yomaRewardPool"),
          }}
        />
      </FormField> */}

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
