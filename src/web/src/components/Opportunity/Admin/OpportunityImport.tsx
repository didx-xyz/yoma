import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Fragment, useCallback, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { FaUpload } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import { IoMdClose, IoMdWarning } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
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
import { CSVImportResult, CSVImportErrorType } from "~/api/models/opportunity";
import { IoWarningOutline, IoCheckmarkCircleOutline } from "react-icons/io5";

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

  const [result, setResult] = useState<CSVImportResult | null>(null);

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

  // Normalize any API response/error into a consistent CSVImportResult
  const toCSVResult = (
    data: any,
    phase: "validation" | "import",
  ): CSVImportResult => {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const r = data as Partial<CSVImportResult>;
      return {
        imported: phase === "import" ? !!r.imported : false,
        headerErrors: !!r.headerErrors,
        recordsTotal: Number(r.recordsTotal ?? 0),
        recordsSucceeded: Number(r.recordsSucceeded ?? 0),
        recordsFailed: Number(r.recordsFailed ?? 0),
        errors: (r as any).errors ?? null,
      };
    }
    if (Array.isArray(data)) {
      const arr = data as Array<{ type?: string; message?: string }>;
      return {
        imported: phase === "import",
        headerErrors: false,
        recordsTotal: 0,
        recordsSucceeded: 0,
        recordsFailed: Math.max(1, arr.length),
        errors: [
          {
            number: null,
            alias: "General",
            items: arr.map((e) => ({
              type: "ProcessingError",
              message: e?.message ?? "An error occurred.",
              field: null,
              value: null,
            })),
          },
        ],
      };
    }
    return {
      imported: phase === "import",
      headerErrors: false,
      recordsTotal: 0,
      recordsSucceeded: 0,
      recordsFailed: 1,
      errors: [
        {
          number: null,
          alias: "General",
          items: [
            {
              type: CSVImportErrorType.ProcessingError,
              message: "An unknown error occurred. Please try again later.",
              field: null,
              value: null,
            },
          ],
        },
      ],
    };
  };

  const onValidate = useCallback(
    async (data: any) => {
      if (!session) {
        toast.warning("You need to be logged in to import opportunities.");
        return;
      }
      if (data.importFile == null) {
        return;
      }

      setIsLoading(true);
      try {
        const res = await importFromCSV(id, data.importFile, true);
        setResult(toCSVResult(res, "validation"));
      } catch (error: any) {
        setResult(toCSVResult(error?.response?.data, "validation"));
      } finally {
        setIsLoading(false);
      }
    },
    [id, session],
  );

  const onSubmit = useCallback(
    async (data: any) => {
      if (!session) {
        toast.warning("You need to be logged in to import opportunities.");
        return;
      }
      if (data.importFile == null) {
        return;
      }

      setIsLoading(true);
      try {
        // Pass 1: validation
        const validationRaw = await importFromCSV(id, data.importFile, true);
        const validationRes = toCSVResult(validationRaw, "validation");
        setResult(validationRes);

        if (validationRes.headerErrors || validationRes.recordsFailed > 0) {
          return; // show validation errors
        }

        // Pass 2: import
        const finalRaw = await importFromCSV(id, data.importFile, false);
        const finalRes = toCSVResult(finalRaw, "import");
        setResult(finalRes);
        if (onSave) onSave();
      } catch (error: any) {
        setResult(toCSVResult(error?.response?.data, "validation"));
      } finally {
        setIsLoading(false);
      }
    },
    [onSave, id, session],
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
                    setValue("importFile", files[0], { shouldValidate: true });
                    setResult(null); // clear previous results
                  }}
                />
              </div>

              {errors.importFile && (
                <FormMessage messageType={FormMessageType.Warning}>
                  {`${errors.importFile.message}`}
                </FormMessage>
              )}

              {/* IMPORT RESPONSE */}
              {result && (
                <div
                  className={`flex w-full flex-row rounded-lg border-[1px] p-4 ${
                    !result.imported &&
                    (result.headerErrors || result.recordsFailed > 0)
                      ? "border-red-500"
                      : "border-green"
                  }`}
                >
                  <span className={`w-full content-center text-xs`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center gap-1">
                        {!result.imported &&
                        (result.headerErrors || result.recordsFailed > 0) ? (
                          <IoWarningOutline
                            className={`h-6 w-6 flex-none ${
                              result.headerErrors || result.recordsFailed > 0
                                ? "text-red-500"
                                : "text-green"
                            }`}
                          />
                        ) : (
                          <IoCheckmarkCircleOutline
                            className={`h-6 w-6 flex-none ${
                              result.headerErrors || result.recordsFailed > 0
                                ? "text-red-500"
                                : "text-green"
                            }`}
                          />
                        )}
                        <div className="text-sm font-semibold">
                          {result.imported
                            ? "Import Completed"
                            : result.headerErrors || result.recordsFailed > 0
                              ? "Validation Failed"
                              : "Validation Passed"}
                        </div>
                      </div>
                    </div>
                    {(!result.headerErrors || result.imported) && (
                      <div className="flex items-center gap-2 py-2 text-xs font-semibold tracking-wide">
                        Total Records
                        <div className="badge badge-primary">
                          {result.recordsTotal}
                        </div>
                        Succeeded
                        <div className="badge badge-success">
                          {result.recordsSucceeded}
                        </div>
                        Failed
                        <div className="badge badge-warning">
                          {result.recordsFailed}
                        </div>
                      </div>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <ul className="list bg-base-100 rounded-box border-base-200 border shadow-md">
                          {result.errors.map((row, rIdx) => (
                            <Fragment key={`row_${rIdx}`}>
                              {/* Row header */}
                              <li className="bg-base-200/50 border-b-gray flex items-center justify-between border-b px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase opacity-80">
                                <span className="inline-flex items-center gap-2">
                                  <IoMdWarning className="text-warning h-4 w-4" />
                                  {row.alias ?? "Row"} {row.number}
                                </span>
                                <span className="badge badge-ghost text-[10px]">
                                  {row.items.length}{" "}
                                  {row.items.length === 1 ? "error" : "errors"}
                                </span>
                              </li>

                              {/* Row items */}
                              {row.items.map((it, iIdx) => (
                                <li
                                  key={`row_${rIdx}_item_${iIdx}`}
                                  className="list-row hover:bg-base-200/40 items-start gap-3 px-4 py-3 transition-colors"
                                >
                                  <div className="w-8 text-[11px] text-gray-500 tabular-nums">
                                    {String(iIdx + 1).padStart(2, "0")}
                                  </div>

                                  <div className="list-col-grow">
                                    <div className="text-xs font-medium">
                                      {it.message}
                                    </div>
                                    {(it.field || it.value) && (
                                      <div className="mt-1 flex flex-col gap-1 text-xs opacity-60">
                                        {it.field && (
                                          <span>
                                            <strong>Field:</strong>{" "}
                                            <code>{it.field}</code>
                                          </span>
                                        )}

                                        {it.value && (
                                          <span>
                                            <strong>Value:</strong>{" "}
                                            <code>{it.value}</code>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    className={`badge text-xs ${
                                      it.type === "ProcessingError"
                                        ? "badge-warning"
                                        : it.type === "InvalidFieldValue" ||
                                            it.type === "RequiredFieldMissing"
                                          ? "badge-error"
                                          : "badge-info"
                                    }`}
                                  >
                                    {it.type}
                                  </div>
                                </li>
                              ))}
                            </Fragment>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!result.headerErrors &&
                      result.recordsFailed === 0 &&
                      !result.imported && (
                        <div className="mt-2">
                          No issues found. You can proceed to{" "}
                          <span className="font-bold italic">Submit</span>.
                        </div>
                      )}
                  </span>
                </div>
              )}

              <div className="mt-4 mb-10 flex w-full grow gap-4">
                <button
                  type="button"
                  className="btn btn-outline border-green text-green hover:bg-green w-1/3 shrink rounded-full bg-white normal-case hover:border-0 hover:text-white"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline border-green text-green hover:bg-green w-1/3 shrink rounded-full bg-white normal-case hover:border-0 hover:text-white"
                  onClick={() => handleSubmit(onValidate)()}
                  disabled={isLoading}
                >
                  Validate
                </button>
                <button
                  type="submit"
                  className="btn bg-green hover:bg-green w-1/3 shrink rounded-full border-0 text-white normal-case hover:border-1 hover:text-white hover:brightness-110"
                  disabled={isLoading}
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
