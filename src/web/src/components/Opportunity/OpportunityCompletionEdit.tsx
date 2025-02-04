import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useSession } from "next-auth/react";
import Image from "next/image";
import iconCertificate from "public/images/icon-certificate.svg";
import iconClock from "public/images/icon-clock.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconSuccess from "public/images/icon-success.png";
import iconVideo from "public/images/icon-video.svg";
import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import { SpatialType } from "~/api/models/common";
import type { MyOpportunityRequestVerify } from "~/api/models/myOpportunity";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getTimeIntervals } from "~/api/services/lookups";
import { performActionSendForVerificationManual } from "~/api/services/myOpportunities";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_AUDIO_TYPES_LABEL,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_LABEL,
  DATE_FORMAT_SYSTEM,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import { toISOStringForTimezone } from "~/lib/utils";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import SelectButtons from "../Common/SelectButtons";
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
  const { data: session } = useSession();

  const { data: timeIntervalsData } = useQuery({
    queryKey: ["timeIntervals"],
    queryFn: async () => getTimeIntervals(),
  });

  const schema = z
    .object({
      certificate: z.any(),
      picture: z.any(),
      voiceNote: z.any(),
      geometry: z.any(),
      dateStart: z.union([z.string(), z.null()]).optional(),
      dateEnd: z.union([z.string(), z.null()]).optional(),
      commitmentInterval: z
        .object({
          id: z
            .any()
            .transform((value) => (Array.isArray(value) ? value[0] : value)),
          count: z.preprocess(
            (val) => (val === "" ? undefined : Number(val)),
            z.number(),
          ),
        })
        .nullable()
        .optional(),
      recommendable: z.boolean().nullable().optional(),
      starRating: z.preprocess(
        (val) => (val === 0 ? null : val),
        z.number().nullable().optional(),
      ),
      feedback: z.string().nullable().optional(),
    })
    .superRefine((values, ctx) => {
      // Validate that both dateEnd and commitmentInterval are provided
      if (!values.dateEnd) {
        ctx.addIssue({
          message: "End date is required.",
          code: z.ZodIssueCode.custom,
          path: ["dateEnd"],
        });
      } else {
        // Validate dateEnd
        const endDate = new Date(values.dateEnd).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        const oppEndDate = opportunityInfo?.dateEnd
          ? new Date(opportunityInfo.dateEnd).setHours(0, 0, 0, 0)
          : null;

        if (endDate > today) {
          ctx.addIssue({
            message:
              "End date cannot be in the future. Please select today's date or earlier.",
            code: z.ZodIssueCode.custom,
            path: ["dateEnd"],
          });
        }

        if (oppEndDate && endDate > oppEndDate) {
          ctx.addIssue({
            message: `End date cannot be later than the opportunity end date of '${oppEndDate}'.`,
            code: z.ZodIssueCode.custom,
            path: ["dateEnd"],
          });
        }
      }

      if (
        !values.commitmentInterval ||
        !values.commitmentInterval.id ||
        (values.commitmentInterval.count ?? 0) <= 0
      ) {
        ctx.addIssue({
          message: "Commitment interval is required.",
          code: z.ZodIssueCode.custom,
          path: ["commitmentInterval"],
        });
      }

      // Certificate validation
      if (!values.certificate) {
        ctx.addIssue({
          message: "Please upload a certificate.",
          code: z.ZodIssueCode.custom,
          path: ["certificate"],
          fatal: true,
        });
      } else {
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

      // Picture validation
      if (!values.picture) {
        ctx.addIssue({
          message: "Please upload a picture.",
          code: z.ZodIssueCode.custom,
          path: ["picture"],
          fatal: true,
        });
      } else {
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

      // VoiceNote validation
      if (!values.voiceNote) {
        ctx.addIssue({
          message: "Please upload a voice note.",
          code: z.ZodIssueCode.custom,
          path: ["voiceNote"],
          fatal: true,
        });
      } else {
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

      // Geometry validation
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
        certificate: data.certificate,
        picture: data.picture,
        voiceNote: data.voiceNote,
        geometry: data.geometry,
        dateStart: data.dateStart || null,
        dateEnd: data.dateEnd || null,
        commitmentInterval: data.commitmentInterval
          ? {
              id:
                timeIntervalsData?.find(
                  (x) => x.name === data.commitmentInterval?.id,
                )?.id ?? "",
              count: data.commitmentInterval.count,
            }
          : null,
        recommendable: data.recommendable || null,
        starRating: data.starRating || null,
        feedback: data.feedback || null,
      };

      // convert dates to string in format "YYYY-MM-DD"
      if (request.dateStart) {
        request.dateStart = request.dateStart
          ? moment.utc(data.dateStart).format(DATE_FORMAT_SYSTEM)
          : null;
      }
      if (request.dateEnd) {
        request.dateEnd = request.dateEnd
          ? moment.utc(data.dateEnd).format(DATE_FORMAT_SYSTEM)
          : null;
      }

      // force mutal exclusion of date range and interval
      const hasDateRange = Boolean(request.dateStart && request.dateEnd);
      const hasInterval = Boolean(
        request.commitmentInterval &&
          request.commitmentInterval.id &&
          (request.commitmentInterval.count ?? 0) > 0,
      );

      setIsLoading(true);

      performActionSendForVerificationManual(opportunityInfo.id, request)
        .then(() => {
          setIsLoading(false);
          if (onSave) {
            onSave();
          }
        })
        .catch((error) => {
          setIsLoading(false);
          toast(<ApiErrors error={error} />, {
            type: "error",
            toastId: "opportunityCompleteError",
            autoClose: false,
            icon: false,
          });
        });
    },
    [onSave, opportunityInfo, session, timeIntervalsData],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors: errors, isValid: isValid },
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

  //* commitment interval slider
  const [timeIntervalMax, setTimeIntervalMax] = useState(100);

  // set the maximum based on the selected time interval
  useEffect(() => {
    // if watchIntervalId is an array (from SelectButtons) get the first value, else use the value
    const watchInterval = Array.isArray(watchIntervalId)
      ? watchIntervalId[0]
      : watchIntervalId;

    let max = 0;
    switch (watchInterval) {
      case "Minute":
        max = 60;
        break;
      case "Hour":
        max = 24;
        break;
      case "Day":
        max = 30;
        break;
      case "Week":
        max = 12;
        break;
      case "Month":
        max = 60;
        break;
    }

    setTimeIntervalMax(max);

    if (watchIntervalCount > max) {
      setValue("commitmentInterval.count", max);
    }
  }, [watchIntervalId, watchIntervalCount, setTimeIntervalMax, setValue]);

  // set default values
  useEffect(() => {
    setValue("dateEnd", toISOStringForTimezone(new Date()));
    setValue("commitmentInterval.id", "Hour");
  }, [setValue]);

  // trigger validation when these related field change
  // because the schema validation is based on these fields
  useEffect(() => {
    trigger();
  }, [watchIntervalId, watchIntervalCount, trigger]);

  return (
    <>
      {isLoading && <Loading />}
      <form
        key={`OpportunityComplete_${id}`}
        className="flex h-full flex-col gap-2 overflow-y-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row bg-green p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
              onClick={onClose}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="-mt-11 mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-green-dark bg-white p-1 shadow-lg">
                <Image
                  src={iconSuccess}
                  alt="Icon Success"
                  width={35}
                  className="h-auto"
                  sizes="100vw"
                  priority={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <h4 className="font-semibold tracking-wide">
                  Well done for completing this opportunity!
                </h4>
                <div className="tracking-wide text-gray-dark">
                  Upload the required documents below, and once approved,
                  we&apos;ll add the accreditation to your CV!
                </div>
              </div>

              {/* When did you finish? */}
              <div className="flex flex-col rounded-lg border-dotted bg-gray-light">
                <div className="flex w-full flex-row">
                  <div className="ml-2 hidden p-2 md:flex md:p-6">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={32}
                      height={32}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "32px", height: "32px" }}
                    />
                  </div>
                  <div className="flex flex-grow flex-col p-4">
                    <div className="text-center font-bold md:text-start">
                      When did you finish?
                    </div>

                    <div className="text-center text-sm italic text-gray-dark md:text-start">
                      Choose the date that you completed this opportunity.
                    </div>

                    <div className="form-control mt-4 gap-2">
                      <Controller
                        control={control}
                        name="dateEnd"
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            className="input input-sm input-bordered block rounded-md border-gray focus:border-gray focus:outline-none"
                            onChange={(date) =>
                              onChange(toISOStringForTimezone(date))
                            }
                            selected={value ? new Date(value) : null}
                            placeholderText="End Date"
                          />
                        )}
                      />

                      {errors.dateEnd && (
                        <FormMessage
                          messageType={FormMessageType.Warning}
                          className="p-0"
                        >
                          {`${errors.dateEnd.message}`}
                        </FormMessage>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* how long did it take? */}
              <div className="flex flex-col rounded-lg border-dotted bg-gray-light">
                <div className="flex w-full flex-row">
                  <div className="ml-2 hidden p-2 md:flex md:p-6">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={32}
                      height={32}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "32px", height: "32px" }}
                    />
                  </div>
                  <div className="flex flex-grow flex-col p-4">
                    <div className="text-center font-bold md:text-start">
                      How long did it take?
                    </div>

                    <div className="text-center text-sm italic text-gray-dark md:text-start">
                      Choose the time it took to complete this opportunity.
                    </div>

                    <div className="form-control mt-4 gap-2">
                      {/* COMMITMENT INTERVALS */}
                      <div className="flex flex-col pb-2">
                        <div className="flex flex-row justify-start gap-4">
                          <span className="mt-1 text-xs font-semibold text-gray-dark">
                            0
                          </span>

                          <Controller
                            name="commitmentInterval.count"
                            control={control}
                            defaultValue={0}
                            render={({ field: { onChange, value } }) => (
                              <div className="flex w-full flex-col justify-center text-center md:w-64">
                                <input
                                  type="range"
                                  className="range range-warning bg-white"
                                  min="0"
                                  max={timeIntervalMax}
                                  value={value}
                                  onChange={(val) => onChange(val)}
                                />
                                <span className="-mb-3 mt-2 h-8 text-xs font-semibold text-gray-dark">
                                  {value > 0 && watchIntervalId != null && (
                                    <>
                                      {`${value} ${
                                        value > 1
                                          ? `${watchIntervalId}s`
                                          : watchIntervalId
                                      }`}
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                          />

                          <span className="mt-1 text-xs font-semibold text-gray-dark">
                            {timeIntervalMax}
                          </span>
                        </div>
                        <div className="flex flex-row justify-start gap-4">
                          <Controller
                            name="commitmentInterval.id"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              <SelectButtons
                                id="selectButtons_commitmentIntervals"
                                buttons={(timeIntervalsData ?? []).map((x) => ({
                                  id: x.id,
                                  title: x.name,
                                  selected: value?.includes(x.name) ?? false,
                                }))}
                                onChange={(val) => {
                                  const selectedButtons = val.filter(
                                    (btn) => btn.selected,
                                  );
                                  onChange(selectedButtons.map((c) => c.title));
                                }}
                              />
                            )}
                          />
                        </div>
                      </div>

                      {errors.commitmentInterval && (
                        <FormMessage
                          messageType={FormMessageType.Warning}
                          className="p-0"
                        >
                          {`${errors.commitmentInterval.root?.message}`}
                        </FormMessage>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FILE UPLOADS */}
              <div className="flex w-full flex-col items-center justify-center gap-4">
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
                    icon={iconCertificate}
                    onUploadComplete={(files) => {
                      setValue("certificate", files[0], {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <div className="px-4 pb-2 md:pl-20">
                      {errors.certificate && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.certificate.message}`}
                        </FormMessage>
                      )}
                    </div>
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
                    icon={iconPicture}
                    onUploadComplete={(files) => {
                      setValue("picture", files[0], { shouldValidate: true });
                    }}
                  >
                    <div className="px-4 pb-2 md:pl-20">
                      {errors.picture && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.picture.message}`}
                        </FormMessage>
                      )}
                    </div>
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
                    icon={iconVideo}
                    onUploadComplete={(files) => {
                      setValue("voiceNote", files[0], {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <div className="px-4 pb-2 md:pl-20">
                      {errors.voiceNote && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          {`${errors.voiceNote.message}`}
                        </FormMessage>
                      )}
                    </div>
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

              {/* FEEDBACK */}
              <div className="flex flex-col rounded-lg border-dotted bg-gray-light">
                <div className="flex w-full flex-row">
                  <div className="ml-2 hidden p-2 md:flex md:p-6">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={32}
                      height={32}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "32px", height: "32px" }}
                    />
                  </div>
                  <div className="flex flex-grow flex-col p-4">
                    <div className="text-center font-bold md:text-start">
                      Before you go!
                    </div>
                    <div className="text-center text-sm italic text-gray-dark md:text-start">
                      Please rate your experience & provide feedback.
                    </div>
                    <div className="form-control mt-4 gap-2">
                      {/* STAR RATING */}
                      <div className="mb-4 flex flex-col gap-2">
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
                                  className="mask mask-star-2 bg-orange"
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
                              className="textarea textarea-bordered w-full"
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
                  </div>
                </div>
              </div>

              {!isValid && (
                <FormMessage messageType={FormMessageType.Warning}>
                  Please supply the required information above.
                </FormMessage>
              )}

              {/* {errors && (
                <label className="label">
                  <span className="label-text-alt text-base italic text-red-500">
                    {`${JSON.stringify(errors)}`}
                  </span>
                </label>
              )} */}

              <div className="mb-10 mt-4 flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn btn-outline btn-primary w-1/2 flex-shrink rounded-full border-purple bg-white normal-case text-purple"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-1/2 flex-shrink rounded-full bg-purple normal-case text-white md:w-[250px]"
                >
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
