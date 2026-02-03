import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import { z } from "zod";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import {
  createReferralLink,
  getReferralProgramInfoById,
  updateReferralLink,
} from "~/api/services/referrals";
import CustomModal from "~/components/Common/CustomModal";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ApiErrors } from "../Status/ApiErrors";
import { RefereeProgramDetails } from "./RefereeProgramDetails";
import { ReferrerProgramsList } from "./ReferrerProgramsList";
import FormLabel from "../Common/FormLabel";
import { LoadingInline } from "../Status/LoadingInline";

interface CreateLinkModalProps {
  programs: ProgramInfo[];
  selectedProgram?: ProgramInfo; // Pre-selected program (skips step 1)
  editLink?: ReferralLink; // Existing link to edit
  existingLinksCount?: number; // Number of existing links
  showProgramDetails?: boolean; // Show program preview and requirements (default: true)
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (link: ReferralLink) => void;
}

// Validation schema based on API validators
const linkFormSchema = z.object({
  programId: z.string().min(1, "Please select a program"),
  name: z
    .string()
    .min(1, "Link name is required")
    .max(150, "Link name cannot exceed 150 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  includeQRCode: z.boolean().optional(),
});

type LinkFormData = z.infer<typeof linkFormSchema>;

export const ReferrerCreateLinkModal: React.FC<CreateLinkModalProps> = ({
  programs,
  selectedProgram,
  editLink,
  existingLinksCount = 0,
  showProgramDetails = true,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // If editing or a program is pre-selected, skip step 1 and go directly to form
  const [step, setStep] = useState<"select" | "create">("select");
  const [currentProgram, setCurrentProgram] = useState<ProgramInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!editLink;

  const { handleSubmit, setValue, reset } = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      programId: "",
      name: "",
      description: null,
      includeQRCode: false,
    },
  });

  const generateLinkName = useCallback((programName: string) => {
    const now = new Date();
    const stamp = now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14); // YYYYMMDDHHMMSS
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const suffix = `${stamp}-${rand}`;

    const base = (programName || "Program").trim();
    const maxBaseLength = 150 - (suffix.length + 1);
    const safeBase = base.slice(0, Math.max(10, maxBaseLength)).trim();

    return `${safeBase} ${suffix}`;
  }, []);

  // Update state when modal opens with different program or link
  useEffect(() => {
    const init = async () => {
      if (isOpen) {
        // Reset all state first
        setIsLoading(false);

        if (editLink) {
          // Editing mode - go to form with existing data
          setStep("create");
          let program = programs.find((p) => p.id === editLink.programId);

          if (!program) {
            setIsLoading(true);
            try {
              program = await getReferralProgramInfoById(editLink.programId);
            } catch (error) {
              console.error(error);
              toast.error("Could not load program details");
              onClose();
              return;
            } finally {
              setIsLoading(false);
            }
          }

          setCurrentProgram(program || null);
          setValue("programId", editLink.programId);
          setValue("name", editLink.name);
          setValue("description", editLink.description || "");
          setValue("includeQRCode", false); // QR code already exists
        } else if (selectedProgram) {
          // Creating with pre-selected program - reset form to defaults
          setStep("create");
          setCurrentProgram(selectedProgram);
          reset({
            programId: selectedProgram.id,
            name: "",
            description: null,
            includeQRCode: false,
          });
        } else {
          // Creating - show program selection with clean form
          setStep("select");
          setCurrentProgram(null);
          reset({
            programId: "",
            name: "",
            description: null,
            includeQRCode: false,
          });
        }
      }
    };

    void init();
  }, [isOpen, selectedProgram, editLink, programs, setValue, reset, onClose]);

  // Reset modal state when closed
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle program selection
  const handleProgramSelect = useCallback(
    (program: ProgramInfo) => {
      setCurrentProgram(program);
      setValue("programId", program.id);
      setStep("create");
      // Scroll to top when moving to step 2
      setTimeout(() => {
        const modalContent = document.getElementById("custom-modal-content");
        if (modalContent) {
          modalContent.scrollTop = 0;
        }
      }, 100);
    },
    [setValue],
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (data: LinkFormData) => {
      try {
        setIsLoading(true);

        let result: ReferralLink;

        if (isEditMode && editLink) {
          // Update existing link
          result = await updateReferralLink({
            id: editLink.id,
            name: data.name,
            description: data.description || null,
            includeQRCode: data.includeQRCode || false,
          });

          toast.success("Referral link updated successfully!", {
            autoClose: 3000,
            toastId: `link-submit`,
          });

          // Close modal immediately after edit
          onSuccess(result);
          handleClose();
        } else {
          // Create new link
          result = await createReferralLink({
            programId: data.programId,
            name: data.name,
            description: data.description || null,
            includeQRCode: data.includeQRCode || false,
          });

          toast.success("Referral link created successfully!", {
            autoClose: 3000,
            toastId: `link-submit`,
          });

          onSuccess(result);
          handleClose();
        }
      } catch (error: any) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: `link-submit`,
          autoClose: false,
          icon: false,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isEditMode, editLink, onSuccess, handleClose],
  );

  const handleCreateClick = useCallback(() => {
    if (isLoading) return;
    if (!currentProgram) return;

    setValue("name", generateLinkName(currentProgram.name), {
      shouldDirty: true,
    });
    setValue("description", null, { shouldDirty: true });
    setValue("includeQRCode", false, { shouldDirty: true });

    void handleSubmit(onSubmit)();
  }, [
    currentProgram,
    generateLinkName,
    handleSubmit,
    isLoading,
    onSubmit,
    setValue,
  ]);

  const selectStepMessage = useMemo(() => {
    if (programs.length === 0) {
      return {
        title: "Choose a Referral Program",
        description:
          '<div class="space-y-2">' +
          "<p>No active programs are available right now. Please check back later.</p>" +
          "</div>",
      };
    }

    const bullets: string[] = [];

    bullets.push("Each program has different requirements and rewards.");
    bullets.push(
      "Only share with people who haven’t completed onboarding yet — otherwise neither of you will be eligible for rewards.",
    );

    if (!isEditMode && existingLinksCount === 0) {
      bullets.push("First link tip: pick one program and share it widely.");
    }

    if (!isEditMode && existingLinksCount > 0) {
      bullets.push(
        "To maximize reach, share different links across different people and channels.",
      );
    }

    return {
      title: "Choose a Referral Program",
      description:
        '<div class="space-y-2">' +
        "<p>Select the program you want to create a referral link for.</p>" +
        '<ul class="list-disc space-y-1 pl-5 text-left">' +
        bullets.map((b) => `<li>${b}</li>`).join("") +
        "</ul>" +
        "</div>",
    };
  }, [existingLinksCount, isEditMode, programs.length]);

  const createStepMessage = useMemo(() => {
    const bullets: string[] = [];
    if (!isEditMode) {
      bullets.push(
        "You’ll get a shareable URL to send on social media, messaging apps, or email.",
      );
      bullets.push(
        "Avoid creating too many links — abuse can result in your referral access being blocked.",
      );
    } else {
      bullets.push("You’re updating an existing referral link.");
      bullets.push("The program cannot be changed.");
    }

    return {
      title: isEditMode ? "Update Your Link" : "Create Your Link",
      description:
        '<div class="space-y-2">' +
        '<ul class="list-disc space-y-1 pl-5 text-left">' +
        bullets.map((b) => `<li>${b}</li>`).join("") +
        "</ul>" +
        "</div>",
    };
  }, [isEditMode]);

  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={!isLoading}
      className="md:max-h-[700px] md:w-[800px]"
    >
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="bg-theme flex flex-row p-4 shadow-lg">
          <h1 className="grow text-lg font-semibold text-white">
            {step === "select" && "Select Program"}
            {step === "create" &&
              (isEditMode ? "Edit Link" : "Create Referral Link")}
          </h1>
          <button
            type="button"
            className="btn btn-circle text-gray-dark hover:bg-gray btn-sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            <IoMdClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          {/* STEP 1: SELECT PROGRAM */}
          {step === "select" && (
            <div className="space-y-4">
              <NoRowsMessage
                icon="🎁"
                title={selectStepMessage.title}
                description={selectStepMessage.description}
                className="!bg-transparent"
              />

              {programs.length > 0 && (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    Please choose from our available programs below to create
                    your referral link.
                  </p>
                  <ReferrerProgramsList
                    onProgramClick={handleProgramSelect}
                    onCreateLink={handleProgramSelect}
                    initialPageSize={5}
                    context="select"
                  />
                </>
              )}

              {/* Action Buttons */}
              <div className="mt-10 flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange flex-1 normal-case hover:text-white"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Back to List
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CREATE LINK FORM */}
          {step === "create" && isLoading && !currentProgram && (
            <LoadingInline classNameSpinner="h-12 border-orange w-12" />
          )}

          {step === "create" && currentProgram && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <NoRowsMessage
                icon="🔗"
                title={createStepMessage.title}
                description={createStepMessage.description}
                className="!bg-transparent"
              />

              {/* Program Preview */}
              {showProgramDetails && (
                <div className="flex flex-col gap-8">
                  <div className="space-y-2">
                    <FormLabel
                      label="Selected Program"
                      showWarningIcon={false}
                    />
                    <div className="bg-white">
                      <RefereeProgramDetails
                        program={currentProgram}
                        context="preview"
                        perspective="referrer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-10 flex gap-3">
                {!selectedProgram && !editLink ? (
                  <button
                    type="button"
                    className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange flex-1 normal-case hover:text-white"
                    onClick={() => setStep("select")}
                    disabled={isLoading}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline border-orange btn-sm text-orange hover:bg-orange flex-1 normal-case hover:text-white"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Back to List
                  </button>
                )}

                {isEditMode ? (
                  <button
                    type="submit"
                    className="btn btn-sm bg-orange flex-1 gap-2 text-white hover:brightness-110"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Update Link"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm bg-orange flex-1 gap-2 text-white hover:brightness-110"
                    disabled={isLoading}
                    onClick={handleCreateClick}
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Create Link"
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </CustomModal>
  );
};
