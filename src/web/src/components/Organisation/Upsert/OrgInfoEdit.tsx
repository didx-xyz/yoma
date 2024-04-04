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

export interface InputProps {
  formData: OrganizationRequestBase | null;
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
  const [logoExisting] = useState(organisation?.logoURL);
  const [logoFiles, setLogoFiles] = useState(false);

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
      streetAddress: zod.string().min(1, "Street address is required."),
      province: zod.string().min(1, "Province is required."),
      city: zod.string().min(1, "City is required."),
      countryId: zod.string().min(1, "Country is required."),
      postalCode: zod.string().min(1, "Postal code is required."),
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
      if (values.logo && values.logo.length > 0)
        logoCount = logoCount + values.logo.length;

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
  const { register, handleSubmit, formState, setValue, reset } = form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...formData,
        logoExisting: organisation?.logoURL,
      });
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
    <form
      onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
      className="flex flex-col gap-4"
    >
      <div className="form-control">
        <label className="label font-bold">
          <span className="label-text">Organisation name</span>
        </label>
        <input
          type="text"
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="Your organisation name"
          {...register("name")}
          data-autocomplete="organization"
        />
        {formState.errors.name && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
              {`${formState.errors.name.message}`}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label font-bold">
          <span className="label-text">Physical address</span>
        </label>
        <textarea
          className="textarea textarea-bordered rounded-md border-gray text-[1rem] leading-tight focus:border-gray focus:outline-none"
          placeholder="Your organisation's physical address"
          {...register("streetAddress")}
          data-autocomplete="street-address"
        />
        {formState.errors.streetAddress && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
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
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="Your organisation's province/state"
          {...register("province")}
          data-autocomplete="address-level1"
        />
        {formState.errors.province && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
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
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="Your organisation's city/town"
          {...register("city")}
          data-autocomplete="address-level2"
        />
        {formState.errors.city && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
              {`${formState.errors.city.message}`}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label font-bold">
          <span className="label-text">Country</span>
        </label>
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
        {formState.errors.countryId && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
              {`${formState.errors.countryId.message}`}
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
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="Your organisation's postal code/zip"
          {...register("postalCode")}
          data-autocomplete="postal-code"
        />
        {formState.errors.postalCode && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
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
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="www.website.com"
          {...register("websiteURL")}
          data-autocomplete="url"
        />
        {formState.errors.websiteURL && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
              {`${formState.errors.websiteURL.message}`}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label font-bold">
          <span className="label-text">Logo</span>
        </label>

        <div className="flex items-center justify-center pb-4">
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}

          {/* UPLOAD IMAGE */}
          <div className="container mx-auto">
            <AvatarUpload
              onRemoveImageExisting={() => {
                setValue("logoExisting", null);
                setLogoFiles(false);
                setValue("logo", null);
              }}
              onUploadComplete={(files) => {
                setLogoFiles(true);
                setValue("logoExisting", null);
                setValue("logo", files && files.length > 0 ? [files[0]] : []);
              }}
              existingImage={logoExisting ?? ""}
              showExisting={!logoFiles && logoExisting ? true : false}
            />
            {formState.errors.logo && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.logo.message}`}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="form-control">
        <label className="label font-bold">
          <span className="label-text">Organisation tagline</span>
        </label>
        <input
          type="text"
          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
          placeholder="Your organisation tagline"
          {...register("tagline")}
        />
        {formState.errors.tagline && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
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
          className="textarea textarea-bordered rounded-md border-gray text-[1rem] leading-tight focus:border-gray focus:outline-none"
          placeholder="Your organisation biography"
          {...register("biography")}
        />
        {formState.errors.biography && (
          <label className="label font-bold">
            <span className="label-text-alt italic text-red-500">
              {`${formState.errors.biography.message}`}
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
  );
};
