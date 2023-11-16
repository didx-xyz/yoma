/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import {
  OrganizationDocument,
  type Organization,
  type OrganizationProviderType,
  type OrganizationRequestBase,
} from "~/api/models/organisation";
import { getOrganisationProviderTypes } from "~/api/services/organisations";
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  MAX_DOC_SIZE,
  MAX_DOC_SIZE_LABEL,
} from "~/lib/constants";
import { Document } from "./Document";
import { FileUploader } from "./FileUpload";

export interface InputProps {
  formData: OrganizationRequestBase | null;
  organisation?: Organization | null;
  onSubmit?: (fieldValues: FieldValues) => void;
  onCancel?: (fieldValues: FieldValues) => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OrgRolesEdit: React.FC<InputProps> = ({
  formData,
  organisation,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const [registrationDocuments, setRegistrationDocuments] = useState<File[]>(
    (formData?.registrationDocuments as any) ?? [],
  );
  const [educationProviderDocuments, setEducationProviderDocuments] = useState<
    File[]
  >((formData?.educationProviderDocuments as any) ?? []);
  const [businessDocuments, setBusinessDocuments] = useState<File[]>(
    (formData?.businessDocuments as any) ?? [],
  );

  // 👇 use prefetched queries (from server)
  const { data: organisationProviderTypes } = useQuery<
    OrganizationProviderType[]
  >({
    queryKey: ["organisationProviderTypes"],
    queryFn: () => getOrganisationProviderTypes(),
  });

  function getActualDocumentCount(
    existing: any[] | undefined,
    removed: any[] | undefined,
    added: any[] | undefined,
  ) {
    let count = (existing?.length ?? 0) - (removed?.length ?? 0);
    if (count < 0) count = 0;
    const docCount = count + (added?.length ?? 0);
    return docCount;
  }

  const schema = zod
    .object({
      providerTypes: zod
        .array(zod.string().uuid())
        .min(1, "Please select at least one option."),
      // new documents to upload
      registrationDocuments: zod.array(zod.any()).optional(),
      educationProviderDocuments: zod.array(zod.any()).optional(),
      businessDocuments: zod.array(zod.any()).optional(),
      // removed documents
      registrationDocumentsDelete: zod.array(zod.any()).optional(),
      educationProviderDocumentsDelete: zod.array(zod.any()).optional(),
      businessDocumentsDelete: zod.array(zod.any()).optional(),
      // existing (saved) documents
      registrationDocumentsExisting: zod.array(zod.any()).optional(),
      educationProviderDocumentsExisting: zod.array(zod.any()).optional(),
      businessDocumentsExisting: zod.array(zod.any()).optional(),
    })
    .superRefine((values, ctx) => {
      // registration documents are required
      const docCount = getActualDocumentCount(
        values.registrationDocumentsExisting,
        values.registrationDocumentsDelete,
        values.registrationDocuments,
      );
      if (docCount < 1) {
        ctx.addIssue({
          message: "At least one registration document is required..",
          code: zod.ZodIssueCode.custom,
          path: ["registrationDocuments"],
        });
      }

      // if education is selected, education provider documents are required
      //  debugger;
      const educationPT = organisationProviderTypes?.find(
        (x) => x.name == "Education",
      );

      if (
        values.providerTypes?.findIndex((x: string) => x == educationPT?.id) >
        -1
      ) {
        const docCount = getActualDocumentCount(
          values.educationProviderDocumentsExisting,
          values.educationProviderDocumentsDelete,
          values.educationProviderDocuments,
        );
        if (docCount < 1) {
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
        const docCount = getActualDocumentCount(
          values.businessDocumentsExisting,
          values.businessDocumentsDelete,
          values.businessDocuments,
        );
        if (docCount < 1) {
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
        return data.registrationDocuments?.every(
          (file) => file && file.size <= MAX_DOC_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_DOC_SIZE_LABEL}.`,
        path: ["registrationDocuments"],
      },
    )
    .refine(
      (data) => {
        return data.registrationDocuments?.every(
          (file) => file && ACCEPTED_DOC_TYPES.includes(file?.type),
        );
      },
      {
        message: `${ACCEPTED_DOC_TYPES_LABEL} files are accepted.`,
        path: ["registrationDocuments"],
      },
    )
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
    // resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, setValue, getValues, reset } =
    form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...formData,
        registrationDocumentsExisting: organisation?.documents?.filter(
          (x) => x.type == "Registration",
        ),
        educationProviderDocumentsExisting: organisation?.documents?.filter(
          (x) => x.type == "EducationProvider",
        ),
        businessDocumentsExisting: organisation?.documents?.filter(
          (x) => x.type == "Business",
        ),
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

  const onRemoveRegistrationDocument = useCallback(
    (doc: OrganizationDocument) => {
      // remove from existing array
      var arr1 = getValues("registrationDocumentsExisting");
      if (!arr1) arr1 = [];
      arr1 = arr1.filter((x: OrganizationDocument) => x.fileId != doc.fileId);
      setValue("registrationDocumentExisting", arr1);

      // add to deleted array
      var arr2 = getValues("registrationDocumentsDelete");
      if (!arr2) arr2 = [];
      arr2.push(doc.fileId);
      setValue("registrationDocumentsDelete", arr2);
    },
    [setValue, getValues],
  );
  const onRemoveEducationProviderDocument = useCallback(
    (doc: OrganizationDocument) => {
      // remove from existing array
      let arr1 = getValues("educationProviderDocumentsExisting");
      if (!arr1) arr1 = [];
      arr1 = arr1.filter((x: OrganizationDocument) => x.fileId != doc.fileId);
      setValue("educationProviderDocumentsExisting", arr1);

      // add to deleted array
      let arr2 = getValues("educationProviderDocumentsDelete");
      if (!arr2) arr2 = [];
      arr2.push(doc.fileId);
      setValue("educationProviderDocumentsDelete", arr2);
    },
    [setValue, getValues],
  );
  const onRemoveBusinessDocument = useCallback(
    (doc: OrganizationDocument) => {
      // remove from existing array
      let arr1 = getValues("businessDocumentsExisting");
      if (!arr1) arr1 = [];
      arr1 = arr1.filter((x: OrganizationDocument) => x.fileId != doc.fileId);
      setValue("businessDocumentsExisting", arr1);

      // add to deleted array
      let arr2 = getValues("businessDocumentsDelete");
      if (!arr2) arr2 = [];
      arr2.push(doc.fileId);
      setValue("businessDocumentsDelete", arr2);
    },
    [setValue, getValues],
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
                className="checkbox-secondary checkbox"
                // checked={
                //   formData
                //     ? formData.providerTypes.findIndex(
                //         (x) => x && x == item.name,
                //       ) > -1
                //     : undefined
                // }
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

        {/* registration documents */}
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Registration documents</span>
          </label>

          {/* show existing documents */}
          <div className="flex flex-col gap-2">
            {organisation?.documents
              ?.filter((x) => x.type == "Registration")
              .map((item) => (
                <Document
                  key={item.fileId}
                  doc={item}
                  onRemove={onRemoveRegistrationDocument}
                />
              ))}

            {/* upload documents */}
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
          </div>

          {formState.errors.registrationDocuments && (
            <label className="label font-bold">
              <span className="label-text-alt italic text-red-500">
                {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                {`${formState.errors.registrationDocuments.message}`}
              </span>
            </label>
          )}
        </div>

        {/* education provider documents */}
        <div className="form-control">
          <label className="label font-bold">
            <span className="label-text">Education provider documents</span>
          </label>

          <div className="flex flex-col gap-2">
            {/* show existing documents */}
            {organisation?.documents
              ?.filter((x) => x.type == "EducationProvider")
              .map((item) => (
                <Document
                  key={item.fileId}
                  doc={item}
                  onRemove={onRemoveEducationProviderDocument}
                />
              ))}

            {/* upload documents */}
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
          </div>

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

          <div className="flex flex-col gap-2">
            {/* show existing documents */}
            {organisation?.documents
              ?.filter((x) => x.type == "Business")
              .map((item) => (
                <Document
                  key={item.fileId}
                  doc={item}
                  onRemove={onRemoveBusinessDocument}
                />
              ))}

            {/* upload documents */}
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
          </div>

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
        <div className="mt-4 flex flex-col items-center justify-center gap-4">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning btn-md w-full flex-grow normal-case"
              onClick={(data) => onCancel(data)}
            >
              {cancelButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-success btn-md w-full flex-grow normal-case"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
/* eslint-enable */
