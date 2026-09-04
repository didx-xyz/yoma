import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FcComments,
  FcCompactCamera,
  FcGraduationCap,
  FcIdea,
  FcVideoCall,
} from "react-icons/fc";
import { IoMdArrowUp, IoMdChatbubbles, IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import { SpatialType } from "~/api/models/common";
import type { MyOpportunityRequestVerify } from "~/api/models/myOpportunity";
import type {
  CustomFieldValueRequest,
  OpportunityInfo,
} from "~/api/models/opportunity";
import { performActionSendForVerificationManual } from "~/api/services/myOpportunities";
import { useMyOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { CustomFields, getCustomFieldErrors } from "./CustomFields";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_AUDIO_TYPES_LABEL,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_LABEL,
  ACCEPTED_VIDEO_TYPES,
  ACCEPTED_VIDEO_TYPES_LABEL,
  DATE_FORMAT_SYSTEM,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  MAX_FILE_VIDEO_SIZE,
  MAX_FILE_VIDEO_SIZE_LABEL,
} from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import { ApiErrors } from "../Status/ApiErrors";
import { Loading } from "../Status/Loading";
import { FileUpload } from "./FileUpload";
import LocationPicker from "./LocationPicker";

interface InputProps {
  [id: string]: any;
  opportunityInfo: OpportunityInfo | undefined;

  onClose?: () => void;
  onSave?: () => void;
}

export const OpportunityCompletionEdit: React.FC<InputProps> = ({
  id,
  opportunityInfo,
  onClose,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { data: session } = useSession();

  // Definition-driven completion custom fields (YOM-1244 / YOM-1255), loaded per
  // opportunity (type resolved server-side). Renders nothing when none apply.
  const {
    data: customFieldDefinitions,
    isLoading: customFieldDefinitionsIsLoading,
    isError: customFieldDefinitionsIsError,
    refetch: refetchCustomFieldDefinitions,
  } = useMyOpportunityCustomFieldDefinitionsQuery(opportunityInfo?.id ?? "", {
    enabled: !!opportunityInfo?.id,
  });

  const schema = z
    .object({
      certificate: z.any(),
      certificateUploadId: z.string().optional(),
      picture: z.any(),
      pictureUploadId: z.string().optional(),
      voiceNote: z.any(),
      voiceNoteUploadId: z.string().optional(),
      geometry: z.any(),
      video: z.any(),
      videoUploadId: z.string().optional(),
      dateStart: z.union([z.string(), z.null()]).optional(),

      recommendable: z.boolean().nullable().optional(),
      starRating: z.preprocess(
        (val) => (val === 0 ? null : val),
        z.number().nullable().optional(),
      ),
      feedback: z.string().nullable().optional(),
      // definition-driven custom fields; validated against their definitions below
      customFields: z.array(z.any()).nullish(),
    })
    .superRefine((values, ctx) => {
      // custom fields must be valid before submitting (required + typed rules).
      // Per-field errors also render inline in the CustomFields component.
      for (const { error } of getCustomFieldErrors(
        customFieldDefinitions,
        values.customFields as CustomFieldValueRequest[] | null | undefined,
      )) {
        ctx.addIssue({
          message: error,
          code: z.ZodIssueCode.custom,
          path: ["customFields"],
        });
      }

      // Certificate validation
      if (
        opportunityInfo?.verificationTypes?.find((x) => x.type == "FileUpload")
      ) {
        if (!values.certificate && !values.certificateUploadId) {
          ctx.addIssue({
            message: "Please upload a certificate.",
            code: z.ZodIssueCode.custom,
            path: ["certificate"],
            fatal: true,
          });
        } else if (values.certificate && !values.certificateUploadId) {
          const fileType = values.certificate.type;
          if (
            fileType &&
            ![...ACCEPTED_DOC_TYPES, ...ACCEPTED_IMAGE_TYPES].includes(fileType)
          ) {
            ctx.addIssue({
              message: `Certificate file type not supported. Please upload a file of type ${[
                ...ACCEPTED_DOC_TYPES,
                ...ACCEPTED_IMAGE_TYPES,
              ].join(", ")}.`,
              code: z.ZodIssueCode.custom,
              path: ["certificate"],
              fatal: true,
            });
          }
          if (
            values.certificate.size &&
            values.certificate.size > MAX_FILE_SIZE
          ) {
            ctx.addIssue({
              message: `Certificate file size should not exceed ${MAX_FILE_SIZE_LABEL}.`,
              code: z.ZodIssueCode.custom,
              path: ["certificate"],
              fatal: true,
            });
          }
        }
      }

      // Picture validation
      if (
        opportunityInfo?.verificationTypes?.find((x) => x.type == "Picture")
      ) {
        if (!values.picture && !values.pictureUploadId) {
          ctx.addIssue({
            message: "Please upload a picture.",
            code: z.ZodIssueCode.custom,
            path: ["picture"],
            fatal: true,
          });
        } else if (values.picture && !values.pictureUploadId) {
          const fileType = values.picture.type;
          if (fileType && !ACCEPTED_IMAGE_TYPES.includes(fileType)) {
            ctx.addIssue({
              message: `Picture file type not supported. Please upload a file of type ${ACCEPTED_IMAGE_TYPES_LABEL.join(
                ", ",
              )}.`,
              code: z.ZodIssueCode.custom,
              path: ["picture"],
              fatal: true,
            });
          }
          if (values.picture.size && values.picture.size > MAX_FILE_SIZE) {
            ctx.addIssue({
              message: `Picture file size should not exceed ${MAX_FILE_SIZE_LABEL}.`,
              code: z.ZodIssueCode.custom,
              path: ["picture"],
              fatal: true,
            });
          }
        }
      }

      // VoiceNote validation
      if (
        opportunityInfo?.verificationTypes?.find((x) => x.type == "VoiceNote")
      ) {
        if (!values.voiceNote && !values.voiceNoteUploadId) {
          ctx.addIssue({
            message: "Please upload a voice note.",
            code: z.ZodIssueCode.custom,
            path: ["voiceNote"],
            fatal: true,
          });
        } else if (values.voiceNote && !values.voiceNoteUploadId) {
          const fileType = values.voiceNote.type;
          if (fileType && !ACCEPTED_AUDIO_TYPES.includes(fileType)) {
            ctx.addIssue({
              message: `Voice note file type not supported. Please upload a file of type ${ACCEPTED_AUDIO_TYPES_LABEL.join(
                ", ",
              )}.`,
              code: z.ZodIssueCode.custom,
              path: ["voiceNote"],
              fatal: true,
            });
          }
          if (values.voiceNote.size && values.voiceNote.size > MAX_FILE_SIZE) {
            ctx.addIssue({
              message: `Voice note file size should not exceed ${MAX_FILE_SIZE_LABEL}.`,
              code: z.ZodIssueCode.custom,
              path: ["voiceNote"],
              fatal: true,
            });
          }
        }
      }

      // Video validation
      if (opportunityInfo?.verificationTypes?.find((x) => x.type == "Video")) {
        if (!values.video && !values.videoUploadId) {
          ctx.addIssue({
            message: "Please upload a video.",
            code: z.ZodIssueCode.custom,
            path: ["video"],
            fatal: true,
          });
        } else if (values.video && !values.videoUploadId) {
          const fileType = values.video.type;
          if (fileType && !ACCEPTED_VIDEO_TYPES.includes(fileType)) {
            ctx.addIssue({
              message: `Video file type not supported. Please upload a file of type ${ACCEPTED_VIDEO_TYPES_LABEL.join(
                ", ",
              )}.`,
              code: z.ZodIssueCode.custom,
              path: ["video"],
              fatal: true,
            });
          }
          if (values.video.size && values.video.size > MAX_FILE_VIDEO_SIZE) {
            ctx.addIssue({
              message: `Video file size should not exceed ${MAX_FILE_VIDEO_SIZE_LABEL}.`,
              code: z.ZodIssueCode.custom,
              path: ["video"],
              fatal: true,
            });
          }
        }
      }

      // Geometry validation
      if (
        opportunityInfo?.verificationTypes?.find((x) => x.type == "Location")
      ) {
        if (!values.geometry) {
          ctx.addIssue({
            message: "Please select a location from the map.",
            code: z.ZodIssueCode.custom,
            path: ["geometry"],
            fatal: true,
          });
        } else if (
          !values.geometry.coordinates ||
          !Array.isArray(values.geometry.coordinates) ||
          values.geometry.coordinates.length === 0
        ) {
          ctx.addIssue({
            message: "The selected location is invalid.",
            code: z.ZodIssueCode.custom,
            path: ["geometry"],
            fatal: true,
          });
        }
      }

      // Feedback validation
      if (
        values.feedback != null &&
        (values.feedback.length < 1 || values.feedback.length > 500)
      ) {
        ctx.addIssue({
          message: "Feedback must be between 1 and 500 characters.",
          code: z.ZodIssueCode.custom,
          path: ["feedback"],
        });
      }
    });

  type SchemaType = z.infer<typeof schema>;

  const onSubmit = useCallback(
    (data: SchemaType) => {
      if (!session) {
        toast.warning("You need to be logged in to save an opportunity");
        return;
      }
      if (!opportunityInfo) {
        toast.warning("Something went wrong. Please try again.");
        return;
      }

      const request: MyOpportunityRequestVerify = {
        certificate: data.certificateUploadId ? undefined : data.certificate,
        certificateUploadId: data.certificateUploadId || undefined,
        picture: data.pictureUploadId ? undefined : data.picture,
        pictureUploadId: data.pictureUploadId || undefined,
        voiceNote: data.voiceNoteUploadId ? undefined : data.voiceNote,
        voiceNoteUploadId: data.voiceNoteUploadId || undefined,
        video: data.videoUploadId ? undefined : data.video,
        videoUploadId: data.videoUploadId || undefined,
        geometry: data.geometry,
        dateStart: data.dateStart || null,
        dateEnd: null,
        commitmentInterval: null,
        recommendable: data.recommendable || null,
        starRating: data.starRating || null,
        feedback: data.feedback || null,
        // custom fields: submit the FULL applicable collection (replacement semantics —
        // the API clears any custom field omitted from the payload). Reconcile against
        // the current definitions so stale keys are dropped, and drop empty entries.
        customFields: (() => {
          const definitionKeys = new Set(
            (customFieldDefinitions ?? []).map((d) => d.key),
          );
          return (
            (data.customFields ?? []) as CustomFieldValueRequest[]
          ).filter(
            (v) =>
              definitionKeys.has(v.key) &&
              ((v.value != null && v.value.trim() !== "") ||
                (v.values != null && v.values.length > 0)),
          );
        })(),
      };

      // convert dates to UTC string in format "YYYY-MM-DD" while preserving UTC timezone
      if (request.dateStart) {
        request.dateStart = request.dateStart
          ? moment.utc(request.dateStart).format(DATE_FORMAT_SYSTEM)
          : null;
      }

      setIsLoading(true);

      performActionSendForVerificationManual(opportunityInfo.id, request)
        .then(() => {
          // Track opportunity completion
          analytics.opportunity.completed(
            opportunityInfo.id,
            opportunityInfo.title,
          );

          setIsLoading(false);
          if (onSave) {
            onSave();
          }
        })
        .catch((error: any) => {
          setIsLoading(false);
          toast(<ApiErrors error={error} />, {
            type: "error",
            toastId: "opportunityCompleteError",
            autoClose: false,
            icon: false,
          });
        });
    },
    [onSave, opportunityInfo, session, customFieldDefinitions],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors: errors, isValid: isValid, isSubmitted },
    control,
    watch,
    trigger,
  } = useForm({
    mode: "onChange", // Validates on change
    reValidateMode: "onChange", // Re-validates on change
    resolver: zodResolver(schema),
  });
  const watchIntervalId = watch("commitmentInterval.id");
  const watchIntervalCount = watch("commitmentInterval.count");

  // trigger validation for these related fields
  useEffect(() => {
    trigger();
  }, [watchIntervalId, watchIntervalCount, trigger]);

  // re-validate when the applicable custom-field definitions load/change
  // (they arrive asynchronously and drive the customFields validation)
  useEffect(() => {
    void trigger();
  }, [customFieldDefinitions, trigger]);

  return (
    <>
      {isLoading && <Loading />}

      <form
        key={`OpportunityComplete_${id}`}
        className="flex h-full flex-col gap-2 overflow-x-hidden overflow-y-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <div className="bg-green flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={onClose}
            >
              <IoMdClose className="h-5 w-5"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="border-green-dark -mt-11 mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg">
                <span className="text-4xl">🎉</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-4">
              <div
                className="flex flex-col items-center gap-1 text-center"
                style={{ animationDelay: "0.4s" }}
              >
                <h4 className="font-semibold">
                  Well done for completing this opportunity!
                </h4>
                <div className="text-gray-dark tracking-wide">
                  Upload the required documents below, and once approved,
                  we&apos;ll add the accreditation to your CV!
                </div>
              </div>

              {/* FILE UPLOADS */}
              {(opportunityInfo?.verificationTypes?.length ?? 0) > 0 && (
                <div
                  className="flex w-full flex-col items-center justify-center gap-4"
                  style={{ animationDelay: "1s" }}
                >
                  {opportunityInfo?.verificationTypes?.find(
                    (x) => x.type == "FileUpload",
                  ) && (
                    <FileUpload
                      id="fileUploadFileUpload"
                      files={[]}
                      fileTypes={[
                        ...ACCEPTED_DOC_TYPES,
                        ...ACCEPTED_IMAGE_TYPES,
                      ].join(", ")}
                      fileTypesLabels={[
                        ...ACCEPTED_DOC_TYPES_LABEL,
                        ...ACCEPTED_IMAGE_TYPES_LABEL,
                      ].join(", ")}
                      allowMultiple={false}
                      label={
                        opportunityInfo?.verificationTypes?.find(
                          (x) => x.type == "FileUpload",
                        )?.description
                      }
                      iconAlt={<FcGraduationCap className="size-10" />}
                      inlineUpload={true}
                      onUploadComplete={(files) => {
                        if (files && files.length > 0 && files[0]) {
                          const fileData = files[0];
                          if (fileData.uploadId) {
                            // TUS upload complete, set upload ID
                            setValue("certificateUploadId", fileData.uploadId, {
                              shouldValidate: true,
                            });
                            setValue("certificate", undefined, {
                              shouldValidate: true,
                            });

                            // Track file upload completion
                            analytics.trackEvent(
                              "opportunity_completion_file_uploaded",
                              {
                                opportunityId: opportunityInfo?.id,
                                opportunityTitle: opportunityInfo?.title,
                                fileType: "certificate",
                                uploadId: fileData.uploadId,
                                fileName: fileData.file?.name,
                                fileSize: fileData.file?.size,
                              },
                            );
                          } else {
                            // Legacy mode or upload in progress
                            setValue("certificate", fileData.file, {
                              shouldValidate: true,
                            });
                            // Clear upload ID when file changes
                            setValue("certificateUploadId", undefined, {
                              shouldValidate: true,
                            });
                          }
                        } else {
                          // File removed, clear both fields
                          setValue("certificate", undefined, {
                            shouldValidate: true,
                          });
                          setValue("certificateUploadId", undefined, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <>
                        {errors.certificate && (
                          <FormMessage messageType={FormMessageType.Warning}>
                            {`${errors.certificate.message}`}
                          </FormMessage>
                        )}
                      </>
                    </FileUpload>
                  )}

                  {opportunityInfo?.verificationTypes?.find(
                    (x) => x.type == "Picture",
                  ) && (
                    <FileUpload
                      id="fileUploadPicture"
                      files={[]}
                      fileTypes={ACCEPTED_IMAGE_TYPES.join(", ")}
                      fileTypesLabels={ACCEPTED_IMAGE_TYPES_LABEL.join(", ")}
                      allowMultiple={false}
                      label={
                        opportunityInfo?.verificationTypes?.find(
                          (x) => x.type == "Picture",
                        )?.description
                      }
                      iconAlt={<FcCompactCamera className="size-10" />}
                      inlineUpload={true}
                      onUploadComplete={(files) => {
                        if (files && files.length > 0 && files[0]) {
                          const fileData = files[0];
                          if (fileData.uploadId) {
                            // TUS upload complete, set upload ID
                            setValue("pictureUploadId", fileData.uploadId, {
                              shouldValidate: true,
                            });
                            setValue("picture", undefined, {
                              shouldValidate: true,
                            });

                            // Track file upload completion
                            analytics.trackEvent(
                              "opportunity_completion_file_uploaded",
                              {
                                opportunityId: opportunityInfo?.id,
                                opportunityTitle: opportunityInfo?.title,
                                fileType: "picture",
                                uploadId: fileData.uploadId,
                                fileName: fileData.file?.name,
                                fileSize: fileData.file?.size,
                              },
                            );
                          } else {
                            // Legacy mode or upload in progress
                            setValue("picture", fileData.file, {
                              shouldValidate: true,
                            });
                            // Clear upload ID when file changes
                            setValue("pictureUploadId", undefined, {
                              shouldValidate: true,
                            });
                          }
                        } else {
                          // File removed, clear both fields
                          setValue("picture", undefined, {
                            shouldValidate: true,
                          });
                          setValue("pictureUploadId", undefined, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <>
                        {errors.picture && (
                          <FormMessage messageType={FormMessageType.Warning}>
                            {`${errors.picture.message}`}
                          </FormMessage>
                        )}
                      </>
                    </FileUpload>
                  )}

                  {opportunityInfo?.verificationTypes?.find(
                    (x) => x.type == "VoiceNote",
                  ) && (
                    <FileUpload
                      id="fileUploadVoiceNote"
                      files={[]}
                      fileTypes={ACCEPTED_AUDIO_TYPES.join(", ")}
                      fileTypesLabels={ACCEPTED_AUDIO_TYPES_LABEL.join(", ")}
                      allowMultiple={false}
                      label={
                        opportunityInfo?.verificationTypes?.find(
                          (x) => x.type == "VoiceNote",
                        )?.description
                      }
                      iconAlt={<FcComments className="size-10" />}
                      inlineUpload={true}
                      onUploadComplete={(files) => {
                        if (files && files.length > 0 && files[0]) {
                          const fileData = files[0];
                          if (fileData.uploadId) {
                            // TUS upload complete, set upload ID
                            setValue("voiceNoteUploadId", fileData.uploadId, {
                              shouldValidate: true,
                            });
                            setValue("voiceNote", undefined, {
                              shouldValidate: true,
                            });

                            // Track file upload completion
                            analytics.trackEvent(
                              "opportunity_completion_file_uploaded",
                              {
                                opportunityId: opportunityInfo?.id,
                                opportunityTitle: opportunityInfo?.title,
                                fileType: "voiceNote",
                                uploadId: fileData.uploadId,
                                fileName: fileData.file?.name,
                                fileSize: fileData.file?.size,
                              },
                            );
                          } else {
                            // Legacy mode or upload in progress
                            setValue("voiceNote", fileData.file, {
                              shouldValidate: true,
                            });
                            // Clear upload ID when file changes
                            setValue("voiceNoteUploadId", undefined, {
                              shouldValidate: true,
                            });
                          }
                        } else {
                          // File removed, clear both fields
                          setValue("voiceNote", undefined, {
                            shouldValidate: true,
                          });
                          setValue("voiceNoteUploadId", undefined, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <>
                        {errors.voiceNote && (
                          <FormMessage messageType={FormMessageType.Warning}>
                            {`${errors.voiceNote.message}`}
                          </FormMessage>
                        )}
                      </>
                    </FileUpload>
                  )}

                  {opportunityInfo?.verificationTypes?.find(
                    (x) => x.type == "Video",
                  ) && (
                    <FileUpload
                      id="fileUploadVideo"
                      files={[]}
                      fileTypes={ACCEPTED_VIDEO_TYPES.join(", ")}
                      fileTypesLabels={ACCEPTED_VIDEO_TYPES_LABEL.join(", ")}
                      allowMultiple={false}
                      maxFileSize={MAX_FILE_VIDEO_SIZE}
                      maxFileSizeLabel={MAX_FILE_VIDEO_SIZE_LABEL}
                      label={
                        opportunityInfo?.verificationTypes?.find(
                          (x) => x.type == "Video",
                        )?.description
                      }
                      iconAlt={<FcVideoCall className="size-10" />}
                      inlineUpload={true}
                      onUploadComplete={(files) => {
                        if (files && files.length > 0 && files[0]) {
                          const fileData = files[0];
                          if (fileData.uploadId) {
                            // TUS upload complete, set upload ID
                            setValue("videoUploadId", fileData.uploadId, {
                              shouldValidate: true,
                            });
                            setValue("video", undefined, {
                              shouldValidate: true,
                            });

                            // Track file upload completion
                            analytics.trackEvent(
                              "opportunity_completion_file_uploaded",
                              {
                                opportunityId: opportunityInfo?.id,
                                opportunityTitle: opportunityInfo?.title,
                                fileType: "video",
                                uploadId: fileData.uploadId,
                                fileName: fileData.file?.name,
                                fileSize: fileData.file?.size,
                              },
                            );
                          } else {
                            // Legacy mode or upload in progress
                            setValue("video", fileData.file, {
                              shouldValidate: true,
                            });
                            // Clear upload ID when file changes
                            setValue("videoUploadId", undefined, {
                              shouldValidate: true,
                            });
                          }
                        } else {
                          // File removed, clear both fields
                          setValue("video", undefined, {
                            shouldValidate: true,
                          });
                          setValue("videoUploadId", undefined, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <>
                        {errors.video && (
                          <FormMessage messageType={FormMessageType.Warning}>
                            {`${errors.video.message}`}
                          </FormMessage>
                        )}
                      </>
                    </FileUpload>
                  )}

                  {opportunityInfo?.verificationTypes?.find(
                    (x) => x.type == "Location",
                  ) && (
                    <LocationPicker
                      id="locationpicker"
                      label={
                        opportunityInfo?.verificationTypes?.find(
                          (x) => x.type == "Location",
                        )?.description
                      }
                      onSelect={(coords) => {
                        let result = null;
                        if (!coords) result = null;
                        else
                          result = {
                            type: SpatialType.Point,
                            coordinates: [[coords.lng, coords.lat, 0]],
                          };

                        setValue("geometry", result, { shouldValidate: true });
                      }}
                    >
                      <div className="px-4 pb-2">
                        {errors.geometry && (
                          <FormMessage messageType={FormMessageType.Warning}>
                            {`${errors.geometry.message}`}
                          </FormMessage>
                        )}
                      </div>
                    </LocationPicker>
                  )}
                </div>
              )}

              {/* CUSTOM FIELDS (definition-driven, YOM-1244 / YOM-1255) */}
              {/* Definitions load per opportunity; the component renders nothing
                  when none apply (empty state). Values partake in the form's zod
                  validation and submit as one JSON-encoded multipart field. */}

              <div
                className="bg-gray-light flex flex-col rounded-lg border-dotted px-8 py-4"
                style={{ animationDelay: "1.2s" }}
              >
                {opportunityInfo && (
                  <div className="flex w-full flex-col gap-2">
                    {customFieldDefinitionsIsError ? (
                      <div className="flex flex-col items-start gap-2">
                        <FormMessage messageType={FormMessageType.Warning}>
                          Unable to load additional fields. Please try again.
                        </FormMessage>
                        <button
                          type="button"
                          className="btn btn-sm border-green text-green hover:bg-green-dark rounded-full bg-white normal-case hover:border-transparent hover:text-white"
                          onClick={() => void refetchCustomFieldDefinitions()}
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <Controller
                        control={control}
                        name="customFields"
                        render={({ field: { onChange, value } }) => (
                          <CustomFields
                            definitions={customFieldDefinitions}
                            isLoading={customFieldDefinitionsIsLoading}
                            values={
                              value as
                                | CustomFieldValueRequest[]
                                | null
                                | undefined
                            }
                            onChange={onChange}
                            showErrors={isSubmitted}
                          />
                        )}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* FEEDBACK - CUSTOM EXPANDABLE SECTION */}
              <div
                className="bg-gray-light flex flex-col rounded-lg border-dotted"
                style={{ animationDelay: "1.2s" }}
              >
                <div className="flex w-full flex-row">
                  <div className="ml-2 p-4 md:p-6">
                    <FcIdea className="size-10" />
                  </div>
                  <div className="flex grow flex-col p-4">
                    <div className="font-semibold">Before you go!</div>
                    <div className="text-gray-dark text-sm italic">
                      Please rate your experience & provide feedback (optional).
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-sm border-green text-green hover:bg-green-dark bg-white hover:text-white"
                        onClick={() => setShowFeedback(!showFeedback)}
                      >
                        <IoMdChatbubbles className="mr-2 h-5 w-5" />
                        {showFeedback ? "Hide Feedback" : "Give Feedback"}
                      </button>
                    </div>
                  </div>
                </div>

                {showFeedback && (
                  <div className="mt-2 flex flex-col gap-2 border-t border-gray-200 px-4 pb-4">
                    {/* STAR RATING */}
                    <div className="mb-4 flex flex-col gap-2 pt-4">
                      <div>Rating</div>
                      <Controller
                        control={control}
                        name="starRating"
                        defaultValue={0}
                        render={({ field: { onChange, value } }) => (
                          <div className="rating">
                            <input
                              type="radio"
                              name="rating-2"
                              className="rating-hidden"
                              checked={value === 0}
                            />
                            {[1, 2, 3, 4, 5].map((x) => (
                              <input
                                key={x}
                                type="radio"
                                name="rating-2"
                                className="mask bg-orange mask-star-2"
                                checked={value === x}
                                onChange={() => onChange(x)}
                              />
                            ))}
                          </div>
                        )}
                      />
                      {errors.starRating && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.starRating.message}`}
                        </FormMessage>
                      )}
                    </div>

                    {/* FEEDBACK */}
                    <div className="mb-4 flex flex-col gap-2">
                      <div>Feedback</div>
                      <Controller
                        control={control}
                        name="feedback"
                        render={({ field: { onChange, value } }) => (
                          <textarea
                            //className="textarea textarea-bordered w-full"
                            className="blockx textarea-bordered textarea border-gray focus:border-gray w-full rounded-md focus:outline-none"
                            placeholder="Enter your feedback"
                            value={value || ""}
                            onChange={onChange}
                          />
                        )}
                      />
                      {errors.feedback && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.feedback.message}`}
                        </FormMessage>
                      )}
                    </div>

                    {/* RECOMMENDABLE */}
                    <div className="mb-4 flex flex-col gap-2">
                      <div>
                        Would you recommend this opportunity to a friend?
                      </div>
                      <Controller
                        control={control}
                        name="recommendable"
                        render={({ field: { onChange, value } }) => (
                          <input
                            type="checkbox"
                            className="toggle toggle-success"
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                          />
                        )}
                      />
                      {errors.recommendable && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.recommendable.message}`}
                        </FormMessage>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isValid && (
                <FormMessage messageType={FormMessageType.Warning}>
                  Please supply the required information above.
                </FormMessage>
              )}

              <div className="mt-4 mb-10 flex w-full flex-col-reverse gap-4 md:flex-row">
                <button
                  type="button"
                  className="btn border-green text-green hover:bg-green-dark w-full bg-white hover:text-white md:flex-1"
                  onClick={onClose}
                >
                  <IoMdClose className="mr-2 h-5 w-5" />
                  Close Window
                </button>
                <button
                  type="submit"
                  className="btn bg-green hover:bg-green-dark w-full text-white md:flex-1"
                >
                  <IoMdArrowUp className="mr-2 h-5 w-5" />
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
