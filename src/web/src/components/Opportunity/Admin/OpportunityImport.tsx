import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { FaUpload } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import { IoMdClose } from "react-icons/io";
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
import { CSVImportResults } from "../../Common/CSVImportResults";
import { toCSVResult } from "~/lib/csv-import-helper";
import { CSVImportResult } from "~/api/models/opportunity";

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
  const [importSuccess, setImportSuccess] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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

        setImportSuccess(true);
      } catch (error: any) {
        setResult(toCSVResult(error?.response?.data, "validation"));
      } finally {
        setIsLoading(false);
      }
    },
    [onSave, id, session, setImportSuccess],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors: errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [result]);

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
                      <li>
                        Categories (use | to separate multiple)
                        <ul className="mt-2 ml-8 list-disc text-gray-600">
                          <li>Agriculture</li>
                          <li>Career and Personal Development</li>
                          <li>Business and Entrepreneurship</li>
                          <li>Environment and Climate</li>
                          <li>Technology and Digitization</li>
                          <li>Tourism and Hospitality</li>
                          <li>AI, Data and Analytics</li>
                          <li>Creative Industry and Arts</li>
                          <li>Other</li>
                        </ul>
                      </li>
                      <li>Summary</li>
                      <li>Description</li>
                      <li>
                        Languages (use ISO CodeAlpha2, e.g. AF|EN for Afrikaans
                        and English)
                      </li>
                      <li>
                        Location (Countries, use ISO CodeAlpha2, e.g., US|GB for
                        United States and United Kingdom)
                      </li>
                      <li>
                        Difficulty (Beginner, Intermediate, Advanced, Any Level)
                      </li>
                      <li>EffortCount (numeric value)</li>
                      <li>EffortInterval (Hour, Day, Week, Month, Minute)</li>
                      <li>DateStart</li>
                      <li>
                        Skills (
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
                      Skills (
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
              {!importSuccess && (
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
                      setResult(null); // clear previous results
                    }}
                  />
                </div>
              )}

              {errors.importFile && (
                <FormMessage messageType={FormMessageType.Warning}>
                  {`${errors.importFile.message}`}
                </FormMessage>
              )}

              {/* IMPORT RESPONSE */}
              {result && (
                <div ref={resultsRef}>
                  <CSVImportResults
                    result={result}
                    importType="opportunities"
                  />
                </div>
              )}

              <div className="mt-4 mb-10 flex w-full grow gap-4">
                <button
                  type="button"
                  className="btn btn-outline border-green text-green hover:bg-green w-full shrink rounded-full bg-white normal-case hover:border-0 hover:text-white"
                  onClick={onClose}
                >
                  Close
                </button>
                {!importSuccess && (
                  <>
                    <button
                      type="button"
                      className="btn bg-green hover:bg-green w-full shrink rounded-full border-0 text-white normal-case hover:border-1 hover:text-white hover:brightness-110"
                      onClick={() => handleSubmit(onValidate)()}
                      disabled={isLoading}
                    >
                      Validate
                    </button>
                    <button
                      type="submit"
                      className="btn bg-green hover:bg-green w-full shrink rounded-full border-0 text-white normal-case hover:border-1 hover:text-white hover:brightness-110"
                      disabled={isLoading}
                    >
                      Submit
                    </button>
                  </>
                )}
                {importSuccess && (
                  <button
                    type="button"
                    className="btn bg-green hover:bg-green w-full shrink rounded-full border-0 text-white normal-case hover:border-1 hover:text-white hover:brightness-110"
                    onClick={() => {
                      setImportSuccess(false);
                      setResult(null);
                      setValue("importFile", null);
                    }}
                    disabled={isLoading}
                  >
                    Start Over
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
