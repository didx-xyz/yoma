import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { FaUpload } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import type { ErrorResponseItem } from "~/api/models/common";
import { importFromCSV } from "~/api/services/opportunities";
import {
  ACCEPTED_CSV_TYPES,
  ACCEPTED_CSV_TYPES_LABEL,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import FormMessage, { FormMessageType } from "../../Common/FormMessage";
import { Loading } from "../../Status/Loading";
import { FileUpload } from "../FileUpload";
import Link from "next/link";

interface InputProps {
  [id: string]: any;
  onClose?: () => void;
  onSave?: () => void;
}

export const OpportunityImport: React.FC<InputProps> = ({
  id,
  onClose,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const [importResponseSuccess, setImportResponseSuccess] = useState<
    boolean | null
  >(null);
  const [importResponseError, setImportResponseError] = useState<
    ErrorResponseItem[] | null
  >(null);

  const schema = z
    .object({
      importFile: z.any().optional(),
    })
    .superRefine((values, ctx) => {
      // Check for importFile
      if (!values.importFile) {
        ctx.addIssue({
          message: "Please upload a CSV file.",
          code: z.ZodIssueCode.custom,
          path: ["importFile"],
          fatal: true,
        });
      } else {
        const fileType = values.importFile?.type;
        // Validate file type
        if (fileType && !ACCEPTED_CSV_TYPES.includes(fileType)) {
          ctx.addIssue({
            message: `File type not supported. Please upload a file of type ${ACCEPTED_CSV_TYPES_LABEL.join(
              ", ",
            )}.`,
            code: z.ZodIssueCode.custom,
            path: ["importFile"],
            fatal: true,
          });
        }
        // Validate file size if needed
        if (values.importFile?.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            message: `File size should not exceed ${MAX_FILE_SIZE_LABEL}.`,
            code: z.ZodIssueCode.custom,
            path: ["importFile"],
            fatal: true,
          });
        }
      }
    });

  const onSubmit = useCallback(
    (data: any) => {
      if (!session) {
        toast.warning("You need to be logged in to import opportunities.");
        return;
      }

      // prevent form submission if no file is selected
      if (data.importFile == null) {
        return;
      }

      setIsLoading(true);

      importFromCSV(id, data.importFile)
        .then(() => {
          setIsLoading(false);
          if (onSave) {
            onSave();
          }

          // success message
          setImportResponseSuccess(true);
          setImportResponseError(null);
        })
        .catch((error: any) => {
          setIsLoading(false);

          // error message
          setImportResponseSuccess(false);
          if (error?.response?.data) {
            setImportResponseError(error.response?.data as ErrorResponseItem[]);
          }
        });
    },
    [onSave, id, session, setImportResponseSuccess, setImportResponseError],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors: errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <>
      {isLoading && <Loading />}

      <form
        key={`OpportunitiesImport_${id}`}
        className="flex h-full flex-col gap-2 overflow-y-auto"
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
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="border-green-dark -mt-11 mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white p-1 shadow-lg">
                <FaUpload className="text-yellow h-8 w-8" />
              </div>
            </div>

            <div
              className="flex w-full flex-col items-center justify-center gap-2 px-4"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="mb-4 flex flex-col items-center gap-1 text-center">
                <h3>Import Opportunities</h3>

                <div className="text-gray-dark tracking-wide">
                  Upload a CSV file to import opportunities for your
                  organisation.
                </div>
              </div>

              {/* HELP QUESTIONS */}
              <div className="collapse-arrow border-gray collapse rounded-lg border text-left leading-relaxed">
                <input type="radio" name="opp-accordion" />
                <div className="collapse-title font-semibold">
                  What must the file contain?
                </div>
                <div className="collapse-content space-y-4 text-sm">
                  <div>
                    <p className="font-semibold">Required Properties</p>
                    <p className="mb-3">
                      The following properties must be provided for each
                      opportunity:
                    </p>
                    <ul className="ml-5 list-disc">
                      <li>Title</li>
                      <li>Type (Learning, Event, Other, Micro-task)</li>
                      <li>Categories (use | to separate multiple)</li>
                      <li>Summary</li>
                      <li>Description</li>
                      <li>Languages (use Language Lookup endpoint)</li>
                      <li>Location (Countries, use Country Lookup endpoint)</li>
                      <li>
                        Difficulty (Beginner, Intermediate, Advanced, Any Level)
                      </li>
                      <li>EffortCount (numeric value)</li>
                      <li>EffortInterval (Hour, Day, Week, Month, Minute)</li>
                      <li>DateStart</li>
                      <li>
                        Skills (use Skill Lookup endpoint or{" "}
                        <Link
                          href="/admin/skills"
                          className="text-blue-600 underline"
                          target="_blank"
                        >
                          click here
                        </Link>{" "}
                        to search for skills)
                      </li>
                      <li>Keywords</li>
                      <li>Hidden</li>
                      <li>ExternalId</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Optional Properties</p>
                    <p className="mb-3">
                      These properties can be included if applicable:
                    </p>
                    <ul className="ml-5 list-disc">
                      <li>Engagement (Online, Offline, Hybrid)</li>
                      <li>Link</li>
                      <li>DateEnd</li>
                      <li>ParticipantLimit</li>
                      <li>ZltoReward</li>
                      <li>ZltoRewardPool</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Default Properties</p>
                    <p className="mb-3">
                      The following properties default to the following and can
                      not be explicitly set:
                    </p>
                    <ul className="ml-5 list-disc">
                      <li>VerificationEnabled: Enabled</li>
                      <li>VerificationMethod: Automatic</li>
                      <li>CredentialIssuanceEnabled: Enabled</li>
                      <li>SSISchemaName: Opportunity|Default</li>
                      <li>Instructions: Not used (deprecated)</li>
                      <li>ShareWithPartners: null or false</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-base-100x collapse-arrow border-gray collapse rounded-lg border text-left leading-relaxed">
                <input type="radio" name="opp-accordion" />
                <div className="collapse-title font-semibold">Sample File</div>
                <div className="collapse-content text-sm">
                  <p>
                    Download a{" "}
                    <a
                      href="/docs/OpportunityInfoCsvImport_Sample.csv"
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      sample import file
                    </a>{" "}
                    for reference.
                  </p>

                  <p className="mt-3">Note:</p>

                  <ul className="ml-5 list-disc">
                    <li>
                      Use the &quot;|&quot; delimiter for multiple Categories,
                      Languages, Skills.
                    </li>
                    <li>
                      Skills (use Skill Lookup endpoint or{" "}
                      <Link
                        href="/admin/skills"
                        className="text-blue-600 underline"
                        target="_blank"
                      >
                        click here
                      </Link>{" "}
                      to search for skills)
                    </li>
                    <li>Ensure ExternalId is unique for each organization.</li>
                  </ul>
                </div>
              </div>

              {/* FILE UPLOAD */}
              <div className="bg-gray-light flex w-full flex-col rounded-lg border-dotted">
                <FileUpload
                  id="importFileUpload"
                  files={[]}
                  fileTypes={[...ACCEPTED_CSV_TYPES].join(",")}
                  fileTypesLabels={[...ACCEPTED_CSV_TYPES_LABEL].join(",")}
                  allowMultiple={false}
                  iconAlt={<FcDocument className="size-10" />}
                  onUploadComplete={(files) => {
                    setValue("importFile", files[0], {
                      shouldValidate: true,
                    });
                  }}
                >
                  <>
                    {errors.importFile && (
                      <FormMessage messageType={FormMessageType.Warning}>
                        {`${errors.importFile.message}`}
                      </FormMessage>
                    )}
                  </>
                </FileUpload>
              </div>

              {/* IMPORT RESPONSE */}
              {importResponseSuccess != null &&
                importResponseSuccess === true && (
                  <FormMessage messageType={FormMessageType.Success}>
                    Opportunities imported successfully!
                  </FormMessage>
                )}

              {importResponseSuccess != null &&
                importResponseSuccess === false && (
                  <>
                    {importResponseError && (
                      <FormMessage messageType={FormMessageType.Error}>
                        {importResponseError.map((err, index) => (
                          <div key={index} className="text-sm">
                            <strong>{err.type}:</strong> {err.message}
                          </div>
                        ))}
                      </FormMessage>
                    )}
                    {!importResponseError && (
                      <FormMessage messageType={FormMessageType.Error}>
                        An unknown error occurred. Please try again later.
                      </FormMessage>
                    )}
                  </>
                )}

              <div className="mt-4 mb-10 flex w-full grow gap-4">
                <button
                  type="button"
                  className="btn btn-outline border-green text-green hover:bg-green w-1/2 shrink rounded-full bg-white normal-case hover:border-0 hover:text-white"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-green hover:bg-green w-1/2 shrink rounded-full border-0 text-white normal-case hover:border-1 hover:text-white hover:brightness-110"
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
