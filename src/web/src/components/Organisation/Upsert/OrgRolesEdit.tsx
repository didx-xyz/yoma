import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Controller, type FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import type {
  OrganizationDocument,
  Organization,
  OrganizationProviderType,
  OrganizationRequestBase,
} from "~/api/models/organisation";
import { getOrganisationProviderTypes } from "~/api/services/organisations";
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import { Document } from "./Document";
import { FileUploader } from "./FileUpload";
import FormField from "~/components/Common/FormField";
import FormCheckbox from "~/components/Common/FormCheckbox";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";

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
  // 👇 use prefetched queries from server
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
    const count =
      (existing?.length ?? 0) + (added?.length ?? 0) - (removed?.length ?? 0);
    return count < 0 ? 0 : count;
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
      console.warn(
        "registrationDocumentsExisting:",
        values.registrationDocumentsExisting,
      );
      console.warn(
        "registrationDocumentsDelete:",
        values.registrationDocumentsDelete,
      );
      console.warn("registrationDocuments:", values.registrationDocuments);

      // registration documents are required
      const docCount = getActualDocumentCount(
        organisation?.documents?.filter((x) => x.type == "Registration") ?? [],
        values.registrationDocumentsDelete,
        values.registrationDocuments,
      );
      if (docCount < 1) {
        ctx.addIssue({
          message: "At least one registration document is required.",
          code: zod.ZodIssueCode.custom,
          path: ["registrationDocuments"],
        });
      }

      // if education is selected, education provider documents are required
      const educationPT = organisationProviderTypes?.find(
        (x) => x.name == "Education",
      );

      if (values?.providerTypes?.find((x: string) => x == educationPT?.id)) {
        const docCount = getActualDocumentCount(
          organisation?.documents?.filter(
            (x) => x.type == "EducationProvider",
          ) ?? [],
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

      if (values?.providerTypes?.find((x: string) => x == marketplacePT?.id)) {
        const docCount = getActualDocumentCount(
          organisation?.documents?.filter((x) => x.type == "Business") ?? [],
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
          (file) => file && file.size <= MAX_FILE_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_FILE_SIZE_LABEL}.`,
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
          (file) => file && file.size <= MAX_FILE_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_FILE_SIZE_LABEL}.`,
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
          (file) => file && file.size <= MAX_FILE_SIZE,
        );
      },
      {
        message: `Maximum file size is ${MAX_FILE_SIZE_LABEL}.`,
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
  const {
    register,
    handleSubmit,
    formState,
    control,
    setValue,
    getValues,
    reset,
    trigger,
  } = form;
  const watchVerificationTypes = form.watch("providerTypes");

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
        registrationDocuments: formData?.registrationDocuments ?? [],
        registrationDocumentsDelete:
          formData?.registrationDocumentsDelete ?? [],
        educationProviderDocuments: formData?.educationProviderDocuments ?? [],
        educationProviderDocumentsDelete:
          formData?.educationProviderDocumentsDelete ?? [],
        businessDocuments: formData?.businessDocuments ?? [],
        businessDocumentsDelete: formData?.businessDocumentsDelete ?? [],
      });

      // validate the forms on initial load
      // this is needed to show the required field indicators (exclamation icon next to labels) on the first render
      trigger();
    }, 100);
  }, [reset, formData, organisation, trigger]);

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
      let arr1 = getValues("registrationDocumentsExisting");
      if (!arr1) arr1 = [];
      arr1 = arr1.filter((x: OrganizationDocument) => x.fileId != doc.fileId);
      setValue("registrationDocumentsExisting", arr1);

      // add to deleted array
      let arr2 = getValues("registrationDocumentsDelete");
      if (!arr2) arr2 = [];
      arr2.push(doc.fileId);
      setValue("registrationDocumentsDelete", arr2);

      // mark as touched
      trigger("registrationDocuments");
    },
    [setValue, getValues, trigger],
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

      // mark as touched
      trigger("educationProviderDocuments");
    },
    [setValue, getValues, trigger],
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

      // mark as touched
      trigger("businessDocuments");
    },
    [setValue, getValues, trigger],
  );

  return (
    <div className="flex flex-col gap-4">
      {formState.defaultValues && !formState.isValid && (
        <FormRequiredFieldMessage />
      )}

      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-4"
      >
        <FormField
          label="What role will your organisation play within Yoma?"
          showWarningIcon={!!formState.errors.providerTypes?.message}
          showError={
            !!formState.touchedFields.providerTypes || formState.isSubmitted
          }
          error={formState.errors.providerTypes?.message?.toString()}
        >
          {organisationProviderTypes?.map((item) => (
            <FormCheckbox
              id={item.id}
              key={item.id}
              inputProps={{
                value: item.id,
                ...register("providerTypes"),
              }}
              label={item.name}
            />
          ))}
        </FormField>

        {/* REGISTRATION DOCUMENTS */}
        <FormField
          label="Registration documents"
          showWarningIcon={!!formState.errors.registrationDocuments?.message}
          showError={
            !!formState.touchedFields.registrationDocuments ||
            formState.isSubmitted
          }
          error={formState.errors.registrationDocuments?.message?.toString()}
        >
          <>
            {/* show existing documents */}
            <div className="flex flex-col gap-2">
              {getValues("registrationDocumentsExisting")?.map((item: any) => (
                <Document
                  key={item.fileId}
                  doc={item}
                  onRemove={onRemoveRegistrationDocument}
                />
              ))}

              {/* upload documents */}
              <Controller
                name="registrationDocuments"
                control={control}
                defaultValue={[]}
                render={({ field: { onChange, value } }) => (
                  <FileUploader
                    name="registrationDocuments"
                    files={value}
                    allowMultiple={true}
                    fileTypes={ACCEPTED_DOC_TYPES}
                    onUploadComplete={(files) => {
                      onChange(
                        files && files.length > 0
                          ? files.map((x) => x.file)
                          : [],
                      );
                      trigger("registrationDocuments");
                    }}
                  />
                )}
              />
            </div>
          </>
        </FormField>

        {watchVerificationTypes && (
          <>
            {/* EDUCATION PROVIDER DOCUMENTS */}
            {watchVerificationTypes.includes(
              organisationProviderTypes?.find((x) => x.name == "Education")?.id,
            ) && (
              <FormField
                label="Education documents"
                showWarningIcon={
                  !!formState.errors.educationProviderDocuments?.message
                }
                showError={
                  !!formState.touchedFields.educationProviderDocuments ||
                  formState.isSubmitted
                }
                error={formState.errors.educationProviderDocuments?.message?.toString()}
              >
                <div className="flex flex-col gap-2">
                  {/* show existing documents */}
                  {getValues("educationProviderDocumentsExisting")?.map(
                    (item: any) => (
                      <Document
                        key={item.fileId}
                        doc={item}
                        onRemove={onRemoveEducationProviderDocument}
                      />
                    ),
                  )}

                  {/* upload documents */}
                  <Controller
                    name="educationProviderDocuments"
                    control={control}
                    defaultValue={[]}
                    render={({ field: { onChange, value } }) => (
                      <FileUploader
                        name="educationProviderDocuments"
                        files={value}
                        allowMultiple={true}
                        fileTypes={ACCEPTED_DOC_TYPES}
                        onUploadComplete={(files) => {
                          onChange(
                            files && files.length > 0
                              ? files.map((x) => x.file)
                              : [],
                          );
                          trigger("educationProviderDocuments");
                        }}
                      />
                    )}
                  />
                </div>
              </FormField>
            )}

            {/* VAT AND BUSINESS DOCUMENTS */}
            {watchVerificationTypes.includes(
              organisationProviderTypes?.find((x) => x.name == "Marketplace")
                ?.id,
            ) && (
              <FormField
                label="VAT and business document"
                showWarningIcon={!!formState.errors.businessDocuments?.message}
                showError={
                  !!formState.touchedFields.businessDocuments ||
                  formState.isSubmitted
                }
                error={formState.errors.businessDocuments?.message?.toString()}
              >
                <div className="flex flex-col gap-2">
                  {/* show existing documents */}
                  {getValues("businessDocumentsExisting")?.map((item: any) => (
                    <Document
                      key={item.fileId}
                      doc={item}
                      onRemove={onRemoveBusinessDocument}
                    />
                  ))}

                  {/* upload documents */}
                  <Controller
                    name="businessDocuments"
                    control={control}
                    defaultValue={[]}
                    render={({ field: { onChange, value } }) => (
                      <FileUploader
                        name="businessDocuments"
                        files={value}
                        allowMultiple={true}
                        fileTypes={ACCEPTED_DOC_TYPES}
                        onUploadComplete={(files) => {
                          onChange(
                            files && files.length > 0
                              ? files.map((x) => x.file)
                              : [],
                          );
                          trigger("businessDocuments");
                        }}
                      />
                    )}
                  />
                </div>
              </FormField>
            )}
          </>
        )}

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
    </div>
  );
};
