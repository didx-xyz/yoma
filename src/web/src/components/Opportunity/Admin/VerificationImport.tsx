import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaUpload } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import { IoMdCheckmark, IoMdClose, IoMdRefresh } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import type { MyOpportunityRequestVerifyImportCsv } from "~/api/models/myOpportunity";
import { CSVImportResult } from "~/api/models/opportunity";
import { performActionImportVerificationFromCSV } from "~/api/services/myOpportunities";
import {
  ACCEPTED_CSV_TYPES,
  ACCEPTED_CSV_TYPES_LABEL,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "~/lib/constants";
import { toCSVResult } from "~/lib/csv-import-helper";
import { BTN_PRIMARY, BTN_SECONDARY } from "../../Common/buttonStyles";
import { CSVImportResults } from "../../Common/CSVImportResults";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalHeader,
} from "../../Common/ModalChrome";
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
    (data: any) => {
      if (!session) {
        toast.warning("You need to be logged in to import submissions.");
        return;
      }

      // prevent form submission if no file is selected
      if (data.importFile == null) {
        return;
      }

      setIsLoading(true);

      const request: MyOpportunityRequestVerifyImportCsv = {
        file: data.importFile,
        organizationId: id,
        comment: data.comment,
        validateOnly: true,
      };

      performActionImportVerificationFromCSV(request)
        .then((res) => {
          setResult(toCSVResult(res, "validation"));
        })
        .catch((error: any) => {
          setResult(toCSVResult(error?.response?.data, "validation"));
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [id, session],
  );

  const onSubmit = useCallback(
    (data: any) => {
      if (!session) {
        toast.warning("You need to be logged in to import submissions.");
        return;
      }

      // prevent form submission if no file is selected
      if (data.importFile == null) {
        return;
      }

      setIsLoading(true);

      const request: MyOpportunityRequestVerifyImportCsv = {
        file: data.importFile,
        organizationId: id,
        comment: data.comment,
      };

      // Pass 1: validation
      const validationRequest = { ...request, validateOnly: true };
      performActionImportVerificationFromCSV(validationRequest)
        .then((validationRaw) => {
          const validationRes = toCSVResult(validationRaw, "validation");
          setResult(validationRes);

          if (validationRes.headerErrors || validationRes.recordsFailed > 0) {
            setIsLoading(false);
            return; // show validation errors
          }

          // Pass 2: import
          const finalRequest = { ...request, validateOnly: false };
          return performActionImportVerificationFromCSV(finalRequest);
        })
        .then((finalRaw) => {
          if (finalRaw) {
            const finalRes = toCSVResult(finalRaw, "import");
            setResult(finalRes);
            if (onSave) onSave();

            setImportSuccess(true);
          }
        })
        .catch((error: any) => {
          setResult(toCSVResult(error?.response?.data, "validation"));
        })
        .finally(() => {
          setIsLoading(false);
        });
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
          <ModalHeader
            title="Import"
            icon={<FaUpload className="h-5 w-5" />}
            onClose={onClose}
          />
          <div className="flex flex-col items-center justify-center gap-4 px-4">
            {/* Description */}
            <FormMessage
              messageType={FormMessageType.Info}
              classNameLabel="!text-sm"
            >
              Upload a CSV file to import submissions for your organisation.
            </FormMessage>

            {/* HELP QUESTIONS */}
            <div className="collapse-arrow border-gray collapse rounded-lg border text-left leading-relaxed">
              <input type="radio" name="opp-accordion" />
              <div className="collapse-title font-semibold">
                What must the file contain?
              </div>
              <div className="collapse-content space-y-4 text-sm">
                <p className="mb-3">
                  Start from the sample file and keep its core columns in the
                  same order.
                </p>
                <div>
                  <p className="font-semibold">Required Properties</p>
                  <p className="mb-3">Every row must have:</p>
                  <ul className="ml-5 list-disc text-sm">
                    <li>Email or Phone Number (at least one required)</li>
                    <li>
                      Opportunity External Id (must match existing opportunity)
                    </li>
                  </ul>
                  <p className="mt-3 mb-3">
                    Imports work only for opportunities whose verification
                    method is Automatic.
                  </p>
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
                    <li>
                      Country (one ISO CodeAlpha2 code, e.g. ZA for South
                      Africa; Worldwide (WW) is not allowed)
                    </li>
                    <li>
                      DateCompleted (YYYY-MM-DD or YYYY/MM/DD; defaults to the
                      current date if omitted)
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">Optional Custom Field Columns</p>
                  <p className="mb-3">
                    These come after the core columns, each headed CF: plus the
                    field key exactly as shown (headers are case-sensitive; a
                    key without CF: is rejected). Use each only for its
                    opportunity type and leave it blank for the others:
                  </p>
                  <ul className="ml-5 list-disc text-sm">
                    <li>
                      CF:jobEmploymentStartDate (Job — the actual start date,
                      strictly YYYY-MM-DD; not the application deadline)
                    </li>
                    <li>
                      CF:impactActionImpactAchieved (Impact Action — the
                      outcome, up to 1000 characters)
                    </li>
                    <li>
                      CF:eventRole (Event — Participant, Speaker, Panelist,
                      FacilitatorTrainer, CoOrganiser or Volunteer; blank leaves
                      it unspecified)
                    </li>
                  </ul>
                  <p className="mt-3 mb-3">
                    Entrepreneurship — the participant&apos;s venture. All
                    optional here (a manual submission requires the first
                    three); blank leaves a value unreported:
                  </p>
                  <ul className="ml-5 list-disc text-sm">
                    <li>
                      CF:entrepreneurshipBusinessName (up to 255 characters)
                    </li>
                    <li>
                      CF:entrepreneurshipBusinessSummary (up to 300 characters)
                    </li>
                    <li>
                      CF:entrepreneurshipBusinessRegistered (Yes or No — No for
                      an informal venture)
                    </li>
                    <li>
                      CF:entrepreneurshipRegistrationReference (up to 125
                      characters, only for a registered venture)
                    </li>
                    <li>
                      CF:entrepreneurshipSector (ISIC Rev. 5 section letter, A
                      to V — the same options as the Job industry)
                    </li>
                    <li>
                      CF:entrepreneurshipJobsCreated (zero or more, excluding
                      the founder)
                    </li>
                    <li>
                      CF:entrepreneurshipRevenueBand (PreRevenue, Under100,
                      From100To500, From500To2000, From2000To10000, Over10000 —
                      USD a month)
                    </li>
                    <li>
                      CF:entrepreneurshipRevenueCurrency (ISO currency code,
                      e.g. ZAR)
                    </li>
                    <li>
                      CF:entrepreneurshipFundingTypes (Grant, SeedAngel, Equity,
                      FormalLoan, CommunityFinance, FamilyFriends,
                      CompetitionPrize, InKind; separate several with |)
                    </li>
                    <li>
                      CF:entrepreneurshipFundingAmountBand (Under500,
                      From500To2000, From2000To10000, From10000To50000,
                      Over50000 — USD in total)
                    </li>
                    <li>CF:entrepreneurshipFunder (up to 255 characters)</li>
                    <li>
                      CF:entrepreneurshipClientLocation (LocalCommunity,
                      Regional, National, CrossBorder, InternationalOnline)
                    </li>
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

            <div className="bg-base-100x collapse-arrow border-gray collapse rounded-lg border text-left leading-relaxed">
              <input type="radio" name="opp-accordion" />
              <div className="collapse-title font-semibold">Sample File</div>
              <div className="collapse-content text-sm">
                <p>
                  Download a{" "}
                  <a
                    href="/docs/MyOpportunityInfoCsvImport_Sample.csv"
                    target="_blank"
                    className="text-blue-dark underline"
                  >
                    sample import file
                  </a>{" "}
                  for reference.
                </p>
              </div>
            </div>

            {/* FILE UPLOAD */}
            {!importSuccess && (
              <div className="border-gray bg-gray-light flex w-full flex-col rounded-lg border-[1px]">
                <FileUpload
                  id="importFileUpload"
                  files={[]}
                  fileTypes={[...ACCEPTED_CSV_TYPES].join(",")}
                  fileTypesLabels={[...ACCEPTED_CSV_TYPES_LABEL].join(",")}
                  allowMultiple={false}
                  iconAlt={<FcDocument className="size-10" />}
                  onUploadComplete={(files) => {
                    setValue("importFile", files[0]?.file, {
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
              <div ref={resultsRef} className="flex w-full">
                <CSVImportResults result={result} importType="submissions" />
              </div>
            )}

            <ModalActions>
              <button
                type="button"
                className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
                onClick={onClose}
              >
                <IoMdClose className="h-5 w-5" />
                Close
              </button>
              {!importSuccess && (
                <>
                  <button
                    type="button"
                    className={`${BTN_PRIMARY} ${MODAL_ACTION_WIDTH}`}
                    onClick={() => handleSubmit(onValidate)()}
                    disabled={isLoading}
                  >
                    <IoMdCheckmark className="h-5 w-5" />
                    Validate
                  </button>
                  <button
                    type="submit"
                    className={`${BTN_PRIMARY} ${MODAL_ACTION_WIDTH}`}
                    disabled={isLoading}
                  >
                    <FaUpload className="h-4 w-4" />
                    Submit
                  </button>
                </>
              )}
              {importSuccess && (
                <button
                  type="button"
                  className={`${BTN_PRIMARY} ${MODAL_ACTION_WIDTH}`}
                  onClick={() => {
                    setImportSuccess(false);
                    setResult(null);
                    setValue("importFile", null);
                  }}
                  disabled={isLoading}
                >
                  <IoMdRefresh className="h-5 w-5" />
                  Start Over
                </button>
              )}
            </ModalActions>
          </div>
        </div>
      </form>
    </>
  );
};
