import type { OpportunityInfo } from "~/api/models/opportunity";
import Image from "next/image";
import iconSuccess from "public/images/icon-success.webp";
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
} from "~/lib/constants";
import { useCallback, useState } from "react";
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
import { toISOStringForTimezone, toUTCDate } from "~/lib/utils";
import { Loading } from "../Status/Loading";
import { performActionSendForVerificationManual } from "~/api/services/myOpportunities";
import { ApiErrors } from "../Status/ApiErrors";

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

  const schema = z
    .object({
      certificate: z.any().optional(),
      picture: z.any().optional(),
      voiceNote: z.any().optional(),
      geometry: z.any().optional(),
      dateStart: z.union([z.null(), z.string() /*, z.date()*/]).optional(),
      dateEnd: z.union([z.string(), /*z.date(),*/ z.null()]).optional(),
    })
    .superRefine((values, ctx) => {
      if (
        opportunityInfo?.verificationEnabled &&
        opportunityInfo.verificationMethod == "Manual"
      ) {
        if (
          opportunityInfo.verificationTypes?.find(
            (x) => x.type == "FileUpload",
          ) &&
          values.certificate == null
        ) {
          ctx.addIssue({
            message: "Please upload a file.",
            code: z.ZodIssueCode.custom,
            path: ["certificate"],
            fatal: true,
          });
        }
        if (
          opportunityInfo.verificationTypes?.find((x) => x.type == "Picture") &&
          values.picture == null
        ) {
          ctx.addIssue({
            message: "Please upload a file.",
            code: z.ZodIssueCode.custom,
            path: ["picture"],
            fatal: true,
          });
        }
        if (
          opportunityInfo.verificationTypes?.find(
            (x) => x.type == "VoiceNote",
          ) &&
          values.voiceNote == null
        ) {
          ctx.addIssue({
            message: "Please upload a file.",
            code: z.ZodIssueCode.custom,
            path: ["voiceNote"],
            fatal: true,
          });
        }
        if (
          opportunityInfo.verificationTypes?.find(
            (x) => x.type == "Location",
          ) &&
          values.geometry == null
        ) {
          ctx.addIssue({
            message: "Please select a pin location.",
            code: z.ZodIssueCode.custom,
            path: ["geometry"],
            fatal: true,
          });
        }
      }

      if (!values.dateStart) {
        ctx.addIssue({
          message: "Please select a date.",
          code: z.ZodIssueCode.custom,
          path: ["dateStart"],
          fatal: true,
        });
      } /*else if (values.dateStart > new Date()) {
        ctx.addIssue({
          message: "Date cannot be in the future.",
          code: z.ZodIssueCode.custom,
          path: ["dateStart"],
          fatal: true,
        });
      } else if (
        opportunityInfo?.dateStart &&
        values.dateStart < opportunityInfo?.dateStart
      ) {
        ctx.addIssue({
          message: "Date cannot be earlier than opportunity start date.",
          code: z.ZodIssueCode.custom,
          path: ["dateStart"],
          fatal: true,
        });
      } else if (
        opportunityInfo?.dateEnd &&
        values.dateStart > opportunityInfo?.dateEnd
      ) {
        ctx.addIssue({
          message: "Date cannot be after than opportunity end date.",
          code: z.ZodIssueCode.custom,
          path: ["dateStart"],
          fatal: true,
        });
      }*/

      // if (values.dateEnd != null && values.dateEnd > new Date()) {
      //   ctx.addIssue({
      //     message: "Date cannot be in the future.",
      //     code: z.ZodIssueCode.custom,
      //     path: ["dateEnd"],
      //     fatal: true,
      //   });
      // } else if (
      //   opportunityInfo?.dateEnd &&
      //   values.dateEnd != null &&
      //   values.dateEnd > opportunityInfo?.dateEnd
      // ) {
      //   ctx.addIssue({
      //     message: "Date cannot be after than opportunity end date.",
      //     code: z.ZodIssueCode.custom,
      //     path: ["dateEnd"],
      //     fatal: true,
      //   });
      // }
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

      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      const request: MyOpportunityRequestVerify = {
        certificate: data.certificate,
        picture: data.picture,
        voiceNote: data.voiceNote,
        geometry: data.geometry,
        dateStart: data.dateStart ? data.dateStart : null,
        dateEnd: data.dateEnd ? data.dateEnd : null,
      };

      setIsLoading(true);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */

      performActionSendForVerificationManual(opportunityInfo.id, request)
        .then(() => {
          //toast.success("Opportunity saved");
          setIsLoading(false);
          onSave && onSave();
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
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <>
      {isLoading && <Loading />}
      <form
        key={`OpportunityComplete_${id}`}
        className="flex flex-col gap-2"
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
                  height={35}
                  sizes="100vw"
                  priority={true}
                  style={{
                    width: "35px",
                    height: "35px",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-grow flex-col gap-4 overflow-x-hidden overflow-y-scroll px-10 md:max-h-[480px] md:min-h-[350px]">
              <div className="mb-8 flex flex-col items-center gap-1">
                <h4 className="font-semibold tracking-wide">
                  Well done for completing this opportunity!
                </h4>
                <div className="tracking-wide text-gray-dark">
                  Upload the required documents below, and once
                  <br />
                  approved, we&apos;ll add the accreditation to your CV!
                </div>
              </div>

              <div className="flex flex-col rounded-lg border-dotted bg-gray-light">
                <div className="flex w-full flex-row">
                  <div className="ml-2 flex items-center p-6">
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
                  <div className="flex flex-grow flex-col items-start justify-center">
                    <div>When did you complete this opportunity?</div>
                    <div className="text-sm text-gray-dark">
                      Select a start date (end date is optional)
                    </div>
                  </div>
                </div>

                <div className="-mt-2 grid grid-cols-2 gap-4 px-4 pb-4">
                  <div className="form-control">
                    {/* eslint-disable @typescript-eslint/no-unsafe-argument */}
                    <Controller
                      control={control}
                      name="dateStart"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm w-full rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) =>
                            onChange(toISOStringForTimezone(date))
                          }
                          selected={value ? new Date(value) : null}
                          placeholderText="Select Start Date"
                        />
                      )}
                    />
                    {/* eslint-enable @typescript-eslint/no-unsafe-argument */}
                    {errors.dateStart && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${errors.dateStart.message}`}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    {/* eslint-disable @typescript-eslint/no-unsafe-argument */}
                    <Controller
                      control={control}
                      name="dateEnd"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm w-full rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) =>
                            onChange(toISOStringForTimezone(date))
                          }
                          selected={value ? new Date(value) : null}
                          placeholderText="Select End Date"
                        />
                      )}
                    />
                    {/* eslint-enable @typescript-eslint/no-unsafe-argument */}

                    {errors.dateEnd && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${errors.dateEnd.message}`}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-center gap-4">
                {opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "FileUpload",
                ) && (
                  <>
                    <FileUpload
                      id="fileUploadFileUpload"
                      files={[]}
                      fileTypes={ACCEPTED_DOC_TYPES.join(",")}
                      fileTypesLabels={ACCEPTED_DOC_TYPES_LABEL}
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
                  </>
                )}

                {opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "Picture",
                ) && (
                  <>
                    <FileUpload
                      id="fileUploadPicture"
                      files={[]}
                      fileTypes={ACCEPTED_IMAGE_TYPES.join(",")}
                      fileTypesLabels={ACCEPTED_IMAGE_TYPES_LABEL}
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
                  </>
                )}

                {opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "VoiceNote",
                ) && (
                  <>
                    <FileUpload
                      id="fileUploadVoiceNote"
                      files={[]}
                      fileTypes={ACCEPTED_AUDIO_TYPES.join(",")}
                      fileTypesLabels={ACCEPTED_AUDIO_TYPES_LABEL}
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
                  </>
                )}

                {opportunityInfo?.verificationTypes?.find(
                  (x) => x.type == "Location",
                ) && (
                  <>
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
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-grow gap-4">
                <button
                  type="button"
                  className="btn w-1/2 rounded-full border-purple bg-white normal-case text-purple"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn w-1/2 rounded-full bg-purple normal-case text-white md:w-[250px]"
                >
                  Submit
                </button>
              </div>

              {!isValid && (
                <div className="mb-10 mt-0 flex flex-grow justify-center gap-4">
                  <label className="label">
                    <span className="label-text-alt px-4 text-center text-base italic text-red-500">
                      Please fill out the required information above.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
