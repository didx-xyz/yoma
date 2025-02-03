import type { OpportunityInfo } from "~/api/models/opportunity";
import Image from "next/image";
import iconSuccess from "public/images/icon-success.png";
import iconClock from "public/images/icon-clock.svg";
import iconCertificate from "public/images/icon-certificate.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconVideo from "public/images/icon-video.svg";
import { IoMdClose } from "react-icons/io";
import { FileUpload } from "./FileUpload";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_AUDIO_TYPES_LABEL,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_LABEL,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import type { MyOpportunityRequestVerify } from "~/api/models/myOpportunity";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LocationPicker from "./LocationPicker";
import { SpatialType } from "~/api/models/common";
import { toISOStringForTimezone } from "~/lib/utils";
import { Loading } from "../Status/Loading";
import { performActionSendForVerificationManual } from "~/api/services/myOpportunities";
import { ApiErrors } from "../Status/ApiErrors";
import SelectButtons from "../Common/SelectButtons";
import { useQuery } from "@tanstack/react-query";
import { getTimeIntervals } from "~/api/services/lookups";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import { Certificate } from "crypto";

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
      certificate: z.any().optional(),
      picture: z.any().optional(),
      voiceNote: z.any().optional(),
      geometry: z.any().optional(),
      dateStart: z.union([z.string(), z.null()]).optional(),
      dateEnd: z.union([z.string(), z.null()]).optional(),
      commitmentInterval: z
        .object({
          id: z
            .any()
            .transform((value) => (Array.isArray(value) ? value[0] : value)), // SelectButtons returns array
          count: z.preprocess(
            (val) => (val === "" ? undefined : Number(val)),
            z.number(),
          ),
        })
        .nullable()
        .optional(),
      recommendable: z.boolean().nullable().optional(),
      starRating: z.number().nullable().optional(),
      feedback: z.string().nullable().optional(),
    })
    .superRefine((values, ctx) => {
      const hasDateRange = Boolean(values.dateStart && values.dateEnd);
      const hasInterval = Boolean(
        values.commitmentInterval &&
          values.commitmentInterval.id &&
          (values.commitmentInterval.count ?? 0) > 0,
      );

      // Ensure exactly one of the options is selected
      if (hasDateRange === hasInterval) {
        ctx.addIssue({
          message:
            "Either a date range (Start & End date) or commitment interval (time to complete) must be specified, but not both.",
          code: z.ZodIssueCode.custom,
          path: ["dateStart"], // or "commitmentInterval"
          fatal: true,
        });
        return;
      }

      // If user chose date range, validate dateStart & dateEnd
      if (hasDateRange) {
        // Store dates without time
        const startDate = values.dateStart
          ? new Date(values.dateStart).setHours(0, 0, 0, 0)
          : null;
        const endDate = values.dateEnd
          ? new Date(values.dateEnd).setHours(0, 0, 0, 0)
          : null;
        const oppStartDate = opportunityInfo?.dateStart
          ? new Date(opportunityInfo.dateStart).setHours(0, 0, 0, 0)
          : null;
        const oppEndDate = opportunityInfo?.dateEnd
          ? new Date(opportunityInfo.dateEnd).setHours(0, 0, 0, 0)
          : null;
        const today = new Date().setHours(0, 0, 0, 0);

        if (startDate && oppStartDate && startDate < oppStartDate) {
          ctx.addIssue({
            message: `Start date cannot be earlier than the opportunity start date of '${oppStartDate}'.`,
            code: z.ZodIssueCode.custom,
            path: ["dateStart"],
            fatal: true,
          });
        }

        if (endDate) {
          if (startDate && endDate < startDate) {
            ctx.addIssue({
              message: "End date is earlier than the start date.",
              code: z.ZodIssueCode.custom,
              path: ["dateEnd"],
              fatal: true,
            });
          }

          if (endDate > today) {
            ctx.addIssue({
              message:
                "End date cannot be in the future. Please select today's date or earlier.",
              code: z.ZodIssueCode.custom,
              path: ["dateEnd"],
              fatal: true,
            });
          }

          if (oppEndDate && endDate > oppEndDate) {
            ctx.addIssue({
              message: `End date cannot be later than the opportunity end date of '${oppEndDate}'.`,
              code: z.ZodIssueCode.custom,
              path: ["dateEnd"],
              fatal: true,
            });
          }
        }
      }

      // If user chose commitment interval, validate that
      if (hasInterval) {
        const { id, count } = values.commitmentInterval!;
        if (id === "00000000-0000-0000-0000-000000000000") {
          ctx.addIssue({
            message: "Commitment interval is empty or does not exist.",
            code: z.ZodIssueCode.custom,
            path: ["commitmentInterval", "id"],
            fatal: true,
          });
        }
        // Placeholder check to ensure existence in the system
        // if (!commitmentIntervalExistsInSystem(id)) { ... }

        if (count! < 1) {
          ctx.addIssue({
            message:
              "Commitment interval count must be greater than or equal to 1.",
            code: z.ZodIssueCode.custom,
            path: ["commitmentInterval", "count"],
            fatal: true,
          });
        }
      }

      // StarRating validation
      if (
        values.starRating != null &&
        (values.starRating < 1 || values.starRating > 5)
      ) {
        ctx.addIssue({
          message: "Star rating must be between 1 and 5 if specified.",
          code: z.ZodIssueCode.custom,
          path: ["starRating"],
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
          fatal: true,
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

      setIsLoading(true);

      performActionSendForVerificationManual(opportunityInfo.id, request)
        .then(() => {
          //toast.success("Opportunity saved");
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
    [onSave, opportunityInfo, session],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors: errors, isValid: isValid },
    control,
    watch,
  } = useForm({
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
    // start date to current date
    setValue("dateStart", toISOStringForTimezone(new Date()));

    //setValue("commitmentInterval.count", 0);

    // commitment interval type
    setValue("commitmentInterval.id", "Day");
  }, [setValue]);

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
              <div className="mb-2x flex flex-col items-center gap-1 text-center">
                <h4 className="font-semibold tracking-wide">
                  Well done for completing this opportunity!
                </h4>
                <div className="tracking-wide text-gray-dark">
                  Upload the required documents below, and once approved,
                  we&apos;ll add the accreditation to your CV!
                </div>
                {/* <FormMessage messageType={FormMessageType.Success}>
                  Upload the required documents below, and once approved,
                  we&apos;ll add the accreditation to your CV!
                </FormMessage> */}
              </div>

              <div className="flex flex-col rounded-lg border-dotted bg-gray-light">
                <div className="flex w-full flex-row">
                  <div className="ml-2 hidden items-center p-2 md:flex md:p-6">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={32}
                      className="h-auto"
                      sizes="100vw"
                      priority={true}
                    />
                  </div>
                  <div className="flex flex-grow flex-col items-center justify-center py-2 md:items-start">
                    <div className="pl-4 md:pl-0">
                      When did you complete this opportunity?
                    </div>
                    <div className="text-sm text-gray-dark">
                      Select a date range, or the time taken to complete
                    </div>
                  </div>
                </div>

                {/* DATES */}
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="form-control">
                    {/* eslint-disable @typescript-eslint/no-unsafe-argument */}
                    <Controller
                      control={control}
                      name="dateStart"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-sm input-bordered w-32 rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) =>
                            onChange(toISOStringForTimezone(date))
                          }
                          selected={value ? new Date(value) : null}
                          placeholderText="Start Date"
                        />
                      )}
                    />

                    {/* eslint-enable @typescript-eslint/no-unsafe-argument */}
                    {/* {errors.dateStart && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${errors.dateStart.message}`}
                        </span>
                      </label>
                    )} */}
                  </div>

                  <div className="form-control">
                    {/* eslint-disable @typescript-eslint/no-unsafe-argument */}
                    <Controller
                      control={control}
                      name="dateEnd"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-sm input-bordered w-32 rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) =>
                            onChange(toISOStringForTimezone(date))
                          }
                          selected={value ? new Date(value) : null}
                          placeholderText="End Date"
                        />
                      )}
                    />

                    {/* eslint-enable @typescript-eslint/no-unsafe-argument */}
                    {/* {errors.dateEnd && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${errors.dateEnd.message}`}
                        </span>
                      </label>
                    )} */}
                  </div>
                </div>

                <div className="divider">OR</div>

                {/* COMMITMENT INTERVALS */}
                <div className="flex flex-col items-center justify-center pb-2">
                  <div className="flex flex-row justify-start gap-4">
                    <span className="mt-1 text-xs font-semibold text-gray-dark">
                      0
                    </span>

                    <Controller
                      name="commitmentInterval.count"
                      control={control}
                      // defaultValue={
                      //   searchFilter?.commitmentInterval?.interval?.count ?? 0
                      // }
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

                {/* ERRORS */}
                {errors && (
                  <label className="label">
                    <span className="label-text-alt px-4 text-base italic text-red-500">
                      {`${JSON.stringify(errors)}`}
                    </span>
                  </label>
                )}

                <div className="flex flex-col gap-2">
                  {errors.dateStart && (
                    // <label className="label">
                    //   <span className="label-text-alt px-4 text-base italic text-red-500">
                    //     {`${errors.dateStart.message}`}
                    //   </span>
                    // </label>

                    <FormMessage messageType={FormMessageType.Warning}>
                      {`${errors.dateStart.message}`}
                    </FormMessage>
                  )}
                  {errors.dateEnd && (
                    // <label className="label">
                    //   <span className="label-text-alt px-4 text-base italic text-red-500">
                    //     {`${errors.dateEnd.message}`}
                    //   </span>
                    // </label>
                    <FormMessage messageType={FormMessageType.Warning}>
                      {`${errors.dateEnd.message}`}
                    </FormMessage>
                  )}
                </div>
              </div>

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
                    <>
                      {errors.certificate && (
                        <label className="label">
                          <span className="label-text-alt text-base italic text-red-500">
                            {`${errors.certificate.message}`}
                          </span>
                        </label>
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
                    icon={iconPicture}
                    onUploadComplete={(files) => {
                      setValue("picture", files[0], { shouldValidate: true });
                    }}
                  >
                    <>
                      {errors.picture && (
                        <label className="label">
                          <span className="label-text-alt text-base italic text-red-500">
                            {`${errors.picture.message}`}
                          </span>
                        </label>
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
                    icon={iconVideo}
                    onUploadComplete={(files) => {
                      setValue("voiceNote", files[0], {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <>
                      {errors.voiceNote && (
                        <label className="label">
                          <span className="label-text-alt text-base italic text-red-500">
                            {`${errors.voiceNote.message}`}
                          </span>
                        </label>
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
                    <>
                      {errors.geometry && (
                        <label className="label">
                          <span className="label-text-alt text-base italic text-red-500">
                            {`${errors.geometry.message}`}
                          </span>
                        </label>
                      )}
                    </>
                  </LocationPicker>
                )}
              </div>

              {!isValid && (
                // <div className="flex-growx flex justify-center">
                //   <label className="label">
                //     <span className="label-text-alt px-4 text-center text-base italic text-red-500">
                //       Please fill out the required information above.
                //     </span>
                //   </label>
                // </div>
                <FormMessage messageType={FormMessageType.Warning}>
                  Please fill out the required information above.
                </FormMessage>
              )}

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
