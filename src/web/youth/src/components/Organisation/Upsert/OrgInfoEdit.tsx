/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import { type OrganizationRequestBase } from "~/api/models/organisation";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_LABEL,
} from "~/lib/constants";
import { FileUploader } from "./FileUpload";
``;
export interface InputProps {
  organisation: OrganizationRequestBase | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgInfoEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const [logoFiles, setLogoFiles] = useState<File[]>(organisation?.logo as any);

  const schema = zod.object({
    name: zod
      .string()
      .min(1, "Organisation name is required.")
      .max(80, "Maximum of 80 characters allowed."),
    streetAddress: zod.string().min(1, "Street address is required."),
    province: zod.string().min(1, "Province is required."),
    city: zod.string().min(1, "City is required."),
    postalCode: zod.string().min(1, "Postal code is required."),
    websiteURL: zod
      .string()
      .url("Please enter a valid URL (e.g. http://www.example.com)")
      .optional()
      .or(zod.literal("")),
    logo: zod
      .any()
      .refine((files: File[]) => files?.length == 1, "Logo is required.")
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_IMAGE_SIZE,
        `Maximum file size is ${MAX_IMAGE_SIZE_LABEL}.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        "${ACCEPTED_IMAGE_TYPES_LABEL} files are accepted.",
      ),
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
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, setValue, reset } = form;

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
          <label className="label font-bold">
            <span className="label-text">Organisation name</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Your organisation name"
            {...register("name")}
            data-autocomplete="organization"
          />
          {formState.errors.name && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.name.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Street address</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Your organisation's street address"
            {...register("streetAddress")}
            data-autocomplete="street-address"
          />
          {formState.errors.streetAddress && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.streetAddress.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Province</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Your organisation's province/state"
            {...register("province")}
            data-autocomplete="address-level1"
          />
          {formState.errors.province && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.province.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">City</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Your organisation's city/town"
            {...register("city")}
            data-autocomplete="address-level2"
          />
          {formState.errors.city && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.city.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Postal code</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Your organisation's postal code/zip"
            {...register("postalCode")}
            data-autocomplete="postal-code"
          />
          {formState.errors.postalCode && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.postalCode.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Organisation website URL</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="www.website.com"
            {...register("websiteURL")}
            data-autocomplete="url"
          />
          {formState.errors.websiteURL && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.websiteURL.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Logo</span>
          </label>

          <FileUploader
            files={logoFiles as any}
            allowMultiple={false}
            fileTypes={ACCEPTED_IMAGE_TYPES}
            onUploadComplete={(files) => {
              setLogoFiles(files);
              setValue(
                "logo",
                files && files.length > 0 ? [files[0].file] : [],
              );
            }}
          />

          {formState.errors.logo && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.logo.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Organisation tagline</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Your organisation tagline"
            {...register("tagline")}
          />
          {formState.errors.tagline && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.tagline.message}`}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Organisation biography</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Your organisation biography"
            {...register("biography")}
          />
          {formState.errors.biography && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.biography.message}`}
              </span>
            </label>
          )}
        </div>

        {/* BUTTONS */}
        <div className="my-4 flex items-center justify-center gap-2">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning btn-sm flex-grow"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}
          {onSubmit && (
            <button type="submit" className="btn btn-success btn-sm flex-grow">
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
/* eslint-enable */
