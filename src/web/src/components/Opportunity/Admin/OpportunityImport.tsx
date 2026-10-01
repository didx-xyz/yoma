import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaUpload } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import { IoMdCheckmark, IoMdClose, IoMdRefresh } from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import { CSVImportResult } from "~/api/models/opportunity";
import { importFromCSV } from "~/api/services/opportunities";
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
              Upload a CSV file to import opportunities for your organisation.
            </FormMessage>

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
                    <li>
                      Type (Learning, Event, Other, ImpactAction, Job,
                      Entrepreneurship — use ImpactAction for Impact Action)
                    </li>
                    <li>
                      Categories (use | to separate multiple; names containing
                      commas must be wrapped in double quotes, e.g.
                      &quot;Technology, AI &amp; Data|Other&quot;)
                      <ul className="mt-2 ml-8 list-disc text-gray-600">
                        <li>Agriculture, Food, Environment and Climate</li>
                        <li>Beauty &amp; Personal Care</li>
                        <li>Business, Finance &amp; Marketing</li>
                        <li>Creative, Media &amp; Design</li>
                        <li>Education &amp; Teaching</li>
                        <li>Engineering, Science &amp; Mathematics</li>
                        <li>Health, Safety &amp; Wellbeing</li>
                        <li>History, Society &amp; Human Rights</li>
                        <li>Hospitality &amp; Tourism</li>
                        <li>Languages &amp; Communication</li>
                        <li>Law, Governance &amp; Compliance</li>
                        <li>Office, Admin &amp; Professional Skills</li>
                        <li>Personal Development &amp; Career Readiness</li>
                        <li>Retail &amp; Food Services</li>
                        <li>Technology, AI &amp; Data</li>
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
                      Location (Countries, use ISO CodeAlpha2, e.g. ZA|US)
                    </li>
                    <li>DateStart</li>
                    <li>Keywords</li>
                    <li>Hidden</li>
                    <li>ExternalId</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">
                    Required for standard opportunities only (Learning, Event,
                    Other, ImpactAction)
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>EffortCount (numeric value, greater than 0)</li>
                    <li>EffortInterval (Hour, Day, Week, Month, Minute)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">
                    For Job and Entrepreneurship opportunities the following are
                    optional:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>EffortCount</li>
                    <li>EffortInterval</li>
                  </ul>
                  <p className="mt-3">
                    If EffortCount is provided for a Job or Entrepreneurship
                    opportunity, EffortInterval must also be provided, and vice
                    versa.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Optional Properties</p>
                  <p className="mb-3">
                    These properties can be included if applicable:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>Engagement (Remote, OnSite, Hybrid)</li>
                    <li>Link</li>
                    <li>DateEnd</li>
                    <li>ParticipantLimit</li>
                    <li>ZltoReward (not available for Job opportunities)</li>
                    <li>
                      ZltoRewardPool (not available for Job opportunities)
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
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">Optional Columns</p>
                  <p className="mb-3">
                    These columns may be left out of the file entirely. When
                    updating an existing opportunity, a missing column keeps its
                    stored value and a blank cell clears it:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>
                      Provider (informational name, up to 255 characters; does
                      not change the owning organisation)
                    </li>
                    <li>Incentivized (Yes, No)</li>
                    <li>RewardType (None, ZLTO, PartnerIncentive)</li>
                    <li>
                      PartnerIncentiveAmount and PartnerIncentiveCurrency (ISO
                      4217 code, e.g. ZAR) — only for PartnerIncentive, and
                      provided together
                    </li>
                    <li>AccessibilitySupport (Yes, No, AvailableOnRequest)</li>
                    <li>
                      Accommodations (use | to separate multiple; required when
                      AccessibilitySupport is Yes)
                    </li>
                    <li>
                      AccommodationOtherDescription (required when Other is
                      selected, up to 500 characters)
                    </li>
                    <li>AgeFrom and AgeTo (whole years, inclusive)</li>
                    <li>
                      TargetedGroups (use | to separate multiple; Open to all
                      must be selected alone)
                    </li>
                    <li>
                      SustainableDevelopmentGoals (goal numbers 1–17, use | to
                      separate multiple)
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">
                    Difficulty / Experience Level (custom field columns)
                  </p>
                  <p className="mb-3">
                    Difficulty is no longer a column. Use the custom field
                    column for the opportunity&apos;s type, and leave the other
                    types&apos; columns blank:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>
                      Learning: CF:learningDifficulty (Beginner, Intermediate,
                      Advanced, AnyLevel)
                    </li>
                    <li>
                      Other: CF:otherDifficulty (Beginner, Intermediate,
                      Advanced, AnyLevel)
                    </li>
                    <li>
                      ImpactAction: CF:impactActionDifficulty (EntryLevel,
                      ExperienceNeeded, SkillsRequired)
                    </li>
                    <li>
                      Event: CF:eventDifficulty (OpenToAll, FamiliarityNeeded,
                      ExperiencedIndividuals)
                    </li>
                    <li>
                      Job: CF:jobExperienceLevel (None, EntryJunior, Mid,
                      Senior)
                    </li>
                    <li>Entrepreneurship: none</li>
                  </ul>
                  <p className="mt-3">
                    The jobs sample also includes the other Job custom field
                    columns (salary, employment type, work schedule,
                    qualification, industry and category).
                  </p>
                  <p className="mt-3">
                    Impact Action rows may also use these optional columns:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>
                      CF:impactActionToolsRequired (Computer, Smartphone,
                      Tablet, GpsDevice, Camera, PowerBank, ProtectiveEquipment,
                      HandTools, GardeningTools, CleaningEquipment,
                      MeasuringEquipment, Stationery, Other; separate several
                      with |)
                    </li>
                    <li>
                      CF:impactActionToolsOtherDescription (up to 500
                      characters; required with Other and not allowed without it
                      — to clear both, leave both cells empty)
                    </li>
                    <li>
                      CF:impactActionVerifiedActivityType
                      (VerifiedFacilitationSession,
                      WaterQualityMonitoringSession,
                      VerifiedInclusiveStorytelling)
                    </li>
                  </ul>
                  <p className="mt-3">
                    Entrepreneurship rows may also use these optional columns:
                  </p>
                  <ul className="ml-5 list-disc">
                    <li>
                      CF:entrepreneurshipProgrammeType (BeGreen, EKYAN,
                      JACompanyProgramme, UmuziVentures, SupaMotoAcademy, Other)
                    </li>
                    <li>
                      CF:entrepreneurshipProgrammeOtherDescription (up to 255
                      characters; required with Other and not allowed without it
                      — to clear both, leave both cells empty)
                    </li>
                    <li>
                      CF:entrepreneurshipVentureStageTargeted (IdeaPreVenture,
                      InformalSelfEmployed, RegisteredEarlyStage,
                      EstablishedGrowth)
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">Default Properties</p>
                  <p className="mb-3">
                    The following properties default to the following and cannot
                    be explicitly set:
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
                  Download the{" "}
                  <a
                    href="/docs/OpportunityInfoCsvImport_Sample.csv"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    opportunities sample
                  </a>{" "}
                  or{" "}
                  <a
                    href="/docs/OpportunityInfoCsvImport_Sample_Jobs.csv"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    jobs sample
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
                <CSVImportResults result={result} importType="opportunities" />
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
