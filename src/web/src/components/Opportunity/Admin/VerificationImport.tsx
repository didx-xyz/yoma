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
import type { MyOpportunityRequestVerifyImportCsv } from "~/api/models/myOpportunity";
import { performActionImportVerificationFromCSV } from "~/api/services/myOpportunities";
import {
  ACCEPTED_CSV_TYPES,
  ACCEPTED_CSV_TYPES_LABEL,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import FormMessage, { FormMessageType } from "../../Common/FormMessage";
import { Loading } from "../../Status/Loading";
import { FileUpload } from "../FileUpload";

interface InputProps {
  [id: string]: any;
  onClose?: () => void;
  onSave?: () => void;
}

export const VerificationImport: React.FC<InputProps> = ({
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

      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      const request: MyOpportunityRequestVerifyImportCsv = {
        file: data.importFile,
        organizationId: id,
        comment: data.comment,
      };
      /* eslint-enable @typescript-eslint/no-unsafe-argument */

      performActionImportVerificationFromCSV(request)
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
          <div className="flex flex-row bg-green p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
              onClick={onClose}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="-mt-11 mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-green-dark bg-white p-1 shadow-lg">
                <FaUpload className="h-8 w-8 text-yellow" />
              </div>
            </div>

            <div
              className="flex w-full flex-col items-center justify-center gap-2 px-4 opacity-0"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="mb-4 flex flex-col items-center gap-1 text-center">
                <h4 className="font-semibold tracking-wide">
                  Import Verifications
                </h4>
                <div className="tracking-wide text-gray-dark">
                  <p>
                    Upload a CSV file to import verifications for your
                    organisation.
                  </p>
                </div>
              </div>

              {/* HELP QUESTIONS */}
              <div className="collapse collapse-arrow rounded-lg border border-gray text-left leading-relaxed">
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
                    <ul className="ml-5 list-disc text-sm">
                      <li>Email or Phone Number (at least one required)</li>
                      <li>
                        Opportunity External Id (must match existing
                        opportunity)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Optional Properties</p>
                    <p className="mb-3">
                      These properties can be included if applicable:
                    </p>
                    <ul className="ml-5 list-disc text-sm">
                      <li>FirstName</li>
                      <li>Surname</li>
                      <li>Gender (Male, Female, Prefer not to say)</li>
                      <li>Country (Alpha-2 code, use Country Lookup API)</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">User Creation</p>
                      <ul className="ml-5 list-disc text-sm">
                        <li>
                          If a user does not exist, a new user account will be
                          created in the database.
                        </li>
                        <li>
                          When the user later registers in the system, the
                          database account will be automatically linked to their
                          Keycloak account.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        User Profile Updates
                      </p>
                      <ul className="ml-5 list-disc text-sm">
                        <li>
                          If the user already exists but has not registered, the
                          imported values will update the user&apos;s profile
                          properties.
                        </li>
                        <li>
                          If the user has already registered, their profile data
                          will not be updated to reflect the imported values.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-base-100x collapse collapse-arrow rounded-lg border border-gray text-left leading-relaxed">
                <input type="radio" name="opp-accordion" />
                <div className="collapse-title font-semibold">Sample File</div>
                <div className="collapse-content text-sm">
                  <p>
                    Download a{" "}
                    <a
                      href="/docs/MyOpportunityInfoCsvImport_Sample.csv"
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      sample import file
                    </a>{" "}
                    for reference.
                  </p>
                </div>
              </div>

              {/* FILE UPLOAD */}
              <div className="flex w-full flex-col rounded-lg border-dotted bg-gray-light">
                <div className="form-control">
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

              <div className="mb-10 mt-4 flex w-full flex-grow gap-4">
                <button
                  type="button"
                  className="btn btn-outline w-1/2 flex-shrink rounded-full border-green bg-white normal-case text-green hover:border-0 hover:bg-green hover:text-white"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hover:border-1 btn w-1/2 flex-shrink rounded-full border-0 bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
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
