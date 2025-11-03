import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoMdCheckmarkCircle, IoMdClose } from "react-icons/io";
import { IoGift } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { toast } from "react-toastify";
import { z } from "zod";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import {
  createReferralLink,
  updateReferralLink,
} from "~/api/services/referrals";
import CustomModal from "~/components/Common/CustomModal";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import FormToggle from "~/components/Common/FormToggle";
import { ProgramCard } from "./ProgramCard";
import { ProgramRequirements } from "./ProgramRequirements";
import { LinkDetails } from "./LinkDetails";
import { ShareButtons } from "./ShareButtons";
import { ProgramsList } from "./ProgramsList";
import { ApiErrors } from "../Status/ApiErrors";
import { AxiosError } from "axios";

interface CreateLinkModalProps {
  programs: ProgramInfo[];
  selectedProgram?: ProgramInfo; // Pre-selected program (skips step 1)
  editLink?: ReferralLink; // Existing link to edit
  existingLinksCount?: number; // Number of existing links
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

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  programs,
  selectedProgram,
  editLink,
  existingLinksCount = 0,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // If editing or a program is pre-selected, skip step 1 and go directly to form
  const [step, setStep] = useState<"select" | "create" | "success">("select");
  const [currentProgram, setCurrentProgram] = useState<ProgramInfo | null>(
    null,
  );
  const [createdLink, setCreatedLink] = useState<ReferralLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!editLink;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      programId: "",
      name: "",
      description: "",
      includeQRCode: true,
    },
  });

  // Update state when modal opens with different program or link
  useEffect(() => {
    if (isOpen) {
      // Reset all state first
      setCreatedLink(null);
      setIsLoading(false);

      if (editLink) {
        // Editing mode - go to form with existing data
        setStep("create");
        const program = programs.find((p) => p.id === editLink.programId);
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
          description: "",
          includeQRCode: true,
        });
      } else {
        // Creating - show program selection with clean form
        setStep("select");
        setCurrentProgram(null);
        reset({
          programId: "",
          name: "",
          description: "",
          includeQRCode: true,
        });
      }
    }
  }, [isOpen, selectedProgram, editLink, programs, setValue, reset]);

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

          // Show success step for new links
          setCreatedLink(result);
          setStep("success");
          onSuccess(result);

          // Scroll to top when moving to success step
          setTimeout(() => {
            const modalContent = document.getElementById(
              "custom-modal-content",
            );
            if (modalContent) {
              modalContent.scrollTop = 0;
            }
          }, 100);
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

  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={step === "success"}
      className="md:max-h-[90vh] md:w-[800px]"
    >
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="bg-theme flex flex-row p-4 shadow-lg">
          <h1 className="grow text-lg font-semibold text-white">
            {step === "select" && "Select Program"}
            {step === "create" &&
              (isEditMode ? "Edit Link" : "Create Referral Link")}
            {step === "success" && "Success!"}
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
              {/* Icon */}
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-purple-600 bg-gradient-to-br from-purple-50 to-white shadow-lg">
                  <IoGift className="h-10 w-10 text-purple-600" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Choose a Referral Program
                </h2>
                <p className="text-gray-dark mt-2 text-sm">
                  Select the program you want to create a referral link for
                </p>
              </div>

              {/* Warning Messages */}
              {!isEditMode && existingLinksCount === 0 && (
                <FormMessage messageType={FormMessageType.Info}>
                  <strong>First Link!</strong> Please note each program has
                  different requirements &amp; rewards. Check the details before
                  creating the link. Share this link with friends who haven't
                  completed the onboarding yet. If someone has already completed
                  it, neither of you will be eligible for rewards.
                </FormMessage>
              )}

              {!isEditMode && existingLinksCount > 0 && (
                <FormMessage messageType={FormMessageType.Warning}>
                  <strong>Important:</strong> If a user has already completed
                  the onboarding, they and you are not eligible for rewards.
                  Share your links with different people or on different social
                  networks to maximize your reach.
                </FormMessage>
              )}

              {programs.length === 0 && (
                <FormMessage messageType={FormMessageType.Warning}>
                  <div className="text-base">
                    No active programs are available at this time. Please check
                    back later.
                  </div>
                </FormMessage>
              )}

              {programs.length > 0 && (
                <ProgramsList
                  onProgramClick={handleProgramSelect}
                  onCreateLink={handleProgramSelect}
                  initialPageSize={5}
                  showHeader={false}
                  showDescription={false}
                  context="select"
                />
              )}

              {/* Action Buttons */}
              <div className="mt-10 flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline flex-1 border-blue-600 text-blue-600 normal-case hover:bg-blue-600 hover:text-white"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Back to List
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CREATE LINK FORM */}
          {step === "create" && currentProgram && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                  <FaLink className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditMode ? "Update Your Link" : "Create Your Link"}
                </h2>
                <p className="text-gray-dark mt-2 max-w-md text-sm">
                  {isEditMode ? (
                    <>
                      Update the details for your referral link. Note that the
                      program cannot be changed.
                    </>
                  ) : (
                    <>
                      Complete this form to generate your unique referral link
                      for the selected program. Share it with friends, and
                      you'll both may earn rewards when they complete the
                      program requirements!
                    </>
                  )}
                </p>
              </div>

              {/* Warning Messages */}
              {!isEditMode && existingLinksCount === 0 && (
                <FormMessage messageType={FormMessageType.Info}>
                  <strong>Check the program details!</strong> Then share this
                  link with friends who haven't completed the onboarding yet.
                </FormMessage>
              )}

              {/* Program Preview */}
              <div className="space-y-3">
                <div>
                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="flex items-center gap-2 text-base font-bold">
                      <IoGift className="h-5 w-5 text-orange-400" />
                      Selected Program
                    </h3>
                  </div>
                  <div className="bg-white">
                    <ProgramCard program={currentProgram} context="preview" />
                  </div>
                </div>
                <ProgramRequirements
                  program={currentProgram}
                  showPathway={true}
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Link Name */}
                <FormField
                  label="Link Name"
                  subLabel="Give your link a memorable name (max 150 characters)"
                  showWarningIcon={!!errors.name}
                  showError={!!errors.name}
                  error={errors.name?.message}
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <FormInput
                        inputProps={{
                          ...field,
                          type: "text",
                          placeholder: "e.g., My Summer Campaign 2025",
                          disabled: isLoading,
                          maxLength: 150,
                        }}
                      />
                    )}
                  />
                </FormField>

                {/* Description (Optional) */}
                <FormField
                  label="Description (Optional)"
                  subLabel="Add a note to help you remember this link (max 500 characters)"
                  showWarningIcon={!!errors.description}
                  showError={!!errors.description}
                  error={errors.description?.message}
                >
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value || ""}
                        className="input input-bordered w-full rounded-md p-3 text-sm"
                        placeholder="e.g., Sharing with my community group"
                        rows={3}
                        disabled={isLoading}
                        maxLength={500}
                      />
                    )}
                  />
                </FormField>

                {/* Include QR Code */}
                <FormField
                  label="QR Code"
                  subLabel="Generate a QR code for easy sharing"
                  showWarningIcon={false}
                  showError={false}
                  error=""
                >
                  <Controller
                    name="includeQRCode"
                    control={control}
                    render={({ field }) => (
                      <FormToggle
                        id="includeQRCode"
                        label="Include QR code with my link"
                        inputProps={{
                          checked: field.value,
                          onChange: field.onChange,
                          disabled: isLoading,
                        }}
                      />
                    )}
                  />
                </FormField>

                {/* Info Message */}
                <FormMessage messageType={FormMessageType.Info}>
                  {isEditMode ? (
                    <>
                      Your updated link will continue working with all existing
                      referrals. You can track everyone who uses this link from
                      your dashboard.
                    </>
                  ) : (
                    <>
                      <strong>After creating this link:</strong> You'll receive
                      a unique URL to share across social media, messaging apps,
                      or email. When your friends sign up using your link and
                      complete the program requirements, you'll both earn ZLTO
                      rewards. Track all referrals and their progress from your
                      dashboard.
                    </>
                  )}
                </FormMessage>

                {/* Abuse Warning */}
                {!isEditMode && (
                  <FormMessage messageType={FormMessageType.Error}>
                    <strong>Caution:</strong> Don't create too many links as you
                    risk being blocked for abuse of the system. Share
                    responsibly and only with genuine contacts. See our{" "}
                    <a
                      href="/help"
                      target="_blank"
                      className="underline hover:text-orange-700"
                    >
                      Help
                    </a>{" "}
                    or{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="underline hover:text-orange-700"
                    >
                      Terms
                    </a>{" "}
                    section for more information.
                  </FormMessage>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex gap-3">
                {!selectedProgram && !editLink ? (
                  <button
                    type="button"
                    className="btn btn-outline flex-1 border-blue-600 text-blue-600 normal-case hover:bg-blue-600 hover:text-white"
                    onClick={() => setStep("select")}
                    disabled={isLoading}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline flex-1 border-blue-600 text-blue-600 normal-case hover:bg-blue-600 hover:text-white"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Back to List
                  </button>
                )}

                <button
                  type="submit"
                  className="btn flex-1 border-blue-600 bg-blue-600 text-white normal-case hover:bg-blue-700 disabled:brightness-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : isEditMode ? (
                    "Update Link"
                  ) : (
                    "Create Link"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && createdLink && (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                  <IoMdCheckmarkCircle className="h-12 w-12 text-blue-600" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  🎉 Link {isEditMode ? "Updated" : "Created"} Successfully!
                </h2>
                <p className="text-gray-dark mt-2 text-sm">
                  Your referral link is ready to share. You can always find it
                  on your links dashboard.
                </p>
              </div>

              {/* Link Details Card */}
              <LinkDetails
                link={createdLink}
                mode="large"
                showQRCode={true}
                showShare={true}
              />

              {/* Next Steps */}
              <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">
                  🎯 What's Next?
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>📢 Share your link with friends and family</li>
                  <li>📊 Track referrals from your dashboard</li>
                  <li>💰 Earn ZLTO when they complete the program</li>
                </ul>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="bg-theme btn mt-10 w-full text-white normal-case hover:brightness-110"
              >
                Close & View My Links
              </button>
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
};
