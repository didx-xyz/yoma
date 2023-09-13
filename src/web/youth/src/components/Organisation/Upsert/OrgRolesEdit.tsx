/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import {
  type OrganizationRequestBase,
  type OrganizationProviderType,
} from "~/api/models/organisation";
import { getOrganisationProviderTypes } from "~/api/services/organisations";
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  MAX_DOC_SIZE,
  MAX_DOC_SIZE_LABEL,
} from "~/lib/constants";
import { FileUploader } from "./FileUpload";

export interface InputProps {
  organisation: OrganizationRequestBase | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: (fieldValues: FieldValues) => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgRolesEdit: React.FC<InputProps> = ({
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
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

  const schema = zod
    .object({
      providerTypes: zod
        .array(zod.string().uuid())
        .min(1, "Please select at least one option."),
      registrationDocuments: zod
        .any()
        .refine(
          (files: File[]) => files?.length == 1,
          "At least one registration document is required.",
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
      educationProviderDocuments: zod.array(zod.any()).optional(),
      businessDocuments: zod.array(zod.any()).optional(),
    })
    .superRefine((values, ctx) => {
      // if education is selected, education provider documents are required
      const educationPT = organisationProviderTypes?.find(
        (x) => x.name == "Education",
      );

      if (
        values.providerTypes?.findIndex((x: string) => x == educationPT?.id) >
        -1
      ) {
        if (
          values.educationProviderDocuments == null ||
          values.educationProviderDocuments?.length < 1
        ) {
          ctx.addIssue({
            message: "At least one education provider document is required.",
            code: zod.ZodIssueCode.custom,
            path: ["educationProviderDocuments"],
          });
        }
      }

      // if marketplace is selected, business documents are required
      const marketplacePT = organisationProviderTypes?.find(
        (x) => x.name == "Marketplace",
      );

      if (
        values.providerTypes?.findIndex((x: string) => x == marketplacePT?.id) >
        -1
      ) {
        if (
          values.businessDocuments == null ||
          values.businessDocuments?.length < 1
        ) {
          ctx.addIssue({
            message: "At least one VAT/business document is required.",
            code: zod.ZodIssueCode.custom,
            path: ["businessDocuments"],
          });
        }
      }
    })
    .refine(
      (data) => {
        return data.educationProviderDocuments?.every(
          (file) => file && file.size <= MAX_DOC_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
        path: ["educationProviderDocuments"],
      },
    )
    .refine(
      (data) => {
        return data.educationProviderDocuments?.every(
          (file) => file && ACCEPTED_DOC_TYPES.includes(file?.type),
        );
      },
      {
        message: `${ACCEPTED_DOC_TYPES_LABEL} files are accepted.`,
        path: ["educationProviderDocuments"],
      },
    )
    .refine(
      (data) => {
        return data.businessDocuments?.every(
          (file) => file && file.size <= MAX_DOC_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
        path: ["businessDocuments"],
      },
    )
    .refine(
      (data) => {
        return data.businessDocuments?.every(
          (file) => file && ACCEPTED_DOC_TYPES.includes(file?.type),
        );
      },
      {
        message: `${ACCEPTED_DOC_TYPES_LABEL} files are accepted.`,
        path: ["businessDocuments"],
      },
    );

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
                {...register("providerTypes")}
                type="checkbox"
                value={item.id}
                id={item.id}
                className="checkbox-primary checkbox"
              />
              <span className="label-text ml-4">{item.name}</span>
            </label>
          ))}

          {formState.errors.providerTypes && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.providerTypes.message}`}
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

          {formState.errors.registrationDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.registrationDocuments.message}`}
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

          {formState.errors.educationProviderDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.educationProviderDocuments.message}`}
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

          {formState.errors.businessDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.businessDocuments.message}`}
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
              onClick={(data) => onCancel(data)}
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
