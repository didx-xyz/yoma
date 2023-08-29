import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import {
  type OrganizationCreateRequest,
  type OrganizationProviderType,
} from "~/api/models/organisation";
import { getOrganisationProviderTypes } from "~/api/services/organisations";
import {
  ACCEPTED_DOC_TYPES,
  MAX_DOC_SIZE,
  MAX_DOC_SIZE_LABEL,
} from "~/lib/constants";
import { FileUploader } from "./FileUpload";

export interface InputProps {
  organisation: OrganizationCreateRequest | null;
  onSubmit: (fieldValues: FieldValues) => void;
  onCancel: (fieldValues: FieldValues) => void;
}

export const OrgRolesEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
}) => {
  const [registrationDocuments, setRegistrationDocuments] = useState<File[]>(
    (organisation?.registrationDocuments as any) ?? [],
  );
  const [educationProviderDocuments, setEducationProviderDocuments] = useState<
    File[]
  >((organisation?.educationProviderDocuments as any) ?? []);
  const [businessDocuments, setBusinessDocuments] = useState<File[]>(
    (organisation?.businessDocuments as any) ?? [],
  );

  // 👇 use prefetched queries (from server)
  const { data: organisationProviderTypes } = useQuery<
    OrganizationProviderType[]
  >({
    queryKey: ["organisationProviderTypes"],
    queryFn: () => getOrganisationProviderTypes(),
  });

  const schema = zod.object({
    providerTypeIds: zod
      .array(zod.string().uuid())
      .min(1, "Please select at least one option."),
    registrationDocuments: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "Registration document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_DOC_SIZE,
        `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        "${ACCEPTED_DOC_TYPES_LABEL} files are accepted.",
      ),
    educationProviderDocuments: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "Education provider document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_DOC_SIZE,
        `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        "${ACCEPTED_DOC_TYPES_LABEL} files are accepted.",
      ),
    businessDocuments: zod
      .any()
      .refine(
        (files: File[]) => files?.length == 1,
        "VAT/Business document is required.",
      )
      .refine(
        // eslint-disable-next-line
        (files) => files?.[0]?.size <= MAX_DOC_SIZE,
        `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
      )
      .refine(
        // eslint-disable-next-line
        (files) => ACCEPTED_DOC_TYPES.includes(files?.[0]?.type),
        "${ACCEPTED_DOC_TYPES_LABEL} files are accepted.",
      ),
  });

  const form = useForm({
    resolver: zodResolver(schema),
  });
  const {
    register: register,
    handleSubmit: handleSubmit,
    formState: { errors: errors },
    getValues: getValues,
    setValue: setValue,
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
          <label className="label font-bold">
            <span className="label-text">
              What role will your organisation play within Yoma?
            </span>
          </label>
          {organisationProviderTypes?.map((item) => (
            <label
              htmlFor={item.id}
              className="label cursor-pointer justify-normal"
              key={item.id}
            >
              <input
                {...register("providerTypeIds")}
                type="checkbox"
                value={item.id}
                id={item.id}
                className="checkbox-primary checkbox"
              />
              <span className="label-text ml-4">{item.name}</span>
            </label>
          ))}

          {errors.providerTypeIds && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.providerTypeIds.message}`}
              </span>
            </label>
          )}
        </div>
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">
              Organisation registration documents
            </span>
          </label>

          <FileUploader
            files={registrationDocuments}
            allowMultiple={true}
            fileTypes={ACCEPTED_DOC_TYPES}
            onUploadComplete={(files) => {
              setRegistrationDocuments(files);
              setValue(
                "registrationDocuments",
                files && files.length > 0 ? files.map((x) => x.file) : [],
              );
            }}
          />

          {errors.registrationDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.registrationDocuments.message}`}
              </span>
            </label>
          )}
        </div>
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Education provider documents</span>
          </label>

          <FileUploader
            files={educationProviderDocuments}
            allowMultiple={true}
            fileTypes={ACCEPTED_DOC_TYPES}
            onUploadComplete={(files) => {
              setEducationProviderDocuments(files.map((x) => x.file));
              setValue(
                "educationProviderDocuments",
                files && files.length > 0 ? files.map((x) => x.file) : [],
              );
            }}
          />

          {errors.educationProviderDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.educationProviderDocuments.message}`}
              </span>
            </label>
          )}
        </div>
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">VAT and business document</span>
          </label>

          <FileUploader
            files={businessDocuments}
            allowMultiple={true}
            fileTypes={ACCEPTED_DOC_TYPES}
            onUploadComplete={(files) => {
              setBusinessDocuments(files.map((x) => x.file));
              setValue(
                "businessDocuments",
                files && files.length > 0 ? files.map((x) => x.file) : [],
              );
            }}
          />

          {errors.businessDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${errors.businessDocuments.message}`}
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
