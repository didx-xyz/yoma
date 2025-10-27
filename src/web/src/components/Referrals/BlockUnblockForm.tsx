import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import { MdBlock, MdCheckCircle } from "react-icons/md";
import zod from "zod";
import type { BlockReason } from "~/api/models/referrals";
import { getBlockReasons } from "~/api/services/referrals";
import { LoadingInline } from "../Status/LoadingInline";

export interface BlockUnblockFormProps {
  userId: string;
  isBlocked: boolean;
  onSubmit: (data: BlockFormData | UnblockFormData) => void;
  onClose: () => void;
}

export interface BlockFormData {
  userId: string;
  reasonId: string;
  comment: string;
  cancelLinks: boolean;
}

export interface UnblockFormData {
  userId: string;
  comment: string;
}

// Define schemas
const blockSchema = zod.object({
  reasonId: zod.string().min(1, "Reason is required"),
  comment: zod.string().min(1, "Comment is required"),
  cancelLinks: zod.boolean(),
});

const unblockSchema = zod.object({
  comment: zod.string().min(1, "Comment is required"),
});

type BlockFormValues = zod.infer<typeof blockSchema>;
type UnblockFormValues = zod.infer<typeof unblockSchema>;

export const BlockUnblockForm: React.FC<BlockUnblockFormProps> = ({
  userId,
  isBlocked,
  onSubmit,
  onClose,
}) => {
  // Load block reasons (only needed for blocking)
  const {
    data: blockReasons,
    isLoading,
    error,
  } = useQuery<BlockReason[]>({
    queryKey: ["blockReasons"],
    queryFn: async () => {
      const reasons = await getBlockReasons();
      return reasons;
    },
    enabled: !isBlocked, // Only fetch when blocking
  });

  console.log("🎯 BlockUnblockForm state:", {
    isBlocked,
    isLoading,
    blockReasonsCount: blockReasons?.length ?? 0,
    hasError: !!error,
  });

  if (isBlocked) {
    return (
      <UnblockFormComponent
        userId={userId}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    );
  }

  // Show loading state while fetching block reasons
  if (isLoading) {
    return <LoadingInline />;
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-red-500">
        <p>Error loading block reasons</p>
        <p className="text-sm">{String(error)}</p>
      </div>
    );
  }

  return (
    <BlockFormComponent
      userId={userId}
      blockReasons={blockReasons ?? []}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
};

// Separate component for unblock form
const UnblockFormComponent: React.FC<{
  userId: string;
  onSubmit: (data: UnblockFormData) => void;
  onClose: () => void;
}> = ({ userId, onSubmit, onClose }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UnblockFormValues>({
    resolver: zodResolver(unblockSchema),
    defaultValues: { comment: "" },
  });

  const onSubmitHandler = useCallback(
    (data: UnblockFormValues) => {
      onSubmit({
        userId,
        comment: data.comment,
      });
    },
    [userId, onSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex h-full flex-col gap-2 overflow-y-auto"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-theme flex flex-row p-4 shadow-lg">
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
              <MdCheckCircle className="text-green h-10 w-10" />
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
            <div className="mb-4 flex flex-col items-center gap-1 text-center">
              <h3>Unblock User</h3>
              <div className="text-gray-dark tracking-wide">
                Are you sure you want to unblock this user? <br />
                They will be able to share referral links again.
              </div>
            </div>

            {/* Comment */}
            <div className="flex w-full flex-col gap-2">
              <label className="label">
                <span className="label-text font-semibold">Comment *</span>
              </label>
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={`textarea textarea-bordered h-24 w-full ${
                      errors.comment ? "textarea-error" : ""
                    }`}
                    placeholder="Enter a comment..."
                  />
                )}
              />
              {errors.comment && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.comment.message}
                  </span>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 mb-10 flex w-full gap-4">
              <button
                type="button"
                className="btn btn-ghost border-gray w-full shrink"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-success w-full shrink border-0 text-white hover:brightness-110"
              >
                Unblock User
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

// Separate component for block form
const BlockFormComponent: React.FC<{
  userId: string;
  blockReasons: BlockReason[];
  onSubmit: (data: BlockFormData) => void;
  onClose: () => void;
}> = ({ userId, blockReasons, onSubmit, onClose }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: { reasonId: "", comment: "", cancelLinks: false },
  });

  const onSubmitHandler = useCallback(
    (data: BlockFormValues) => {
      onSubmit({
        userId,
        reasonId: data.reasonId,
        comment: data.comment,
        cancelLinks: data.cancelLinks,
      });
    },
    [userId, onSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex h-full flex-col gap-2 overflow-y-auto"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-theme flex flex-row p-4 shadow-lg">
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
              <MdBlock className="text-warning h-10 w-10" />
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
            <div className="mb-4 flex flex-col items-center gap-1 text-center">
              <h3>Block User</h3>
              <div className="text-gray-dark tracking-wide">
                Are you sure you want to block this user? They will not be able
                to share referral links.
              </div>
            </div>

            <div className="flex w-full flex-col gap-2">
              {/* Block Reason */}
              <div className="w-full">
                <label className="label">
                  <span className="label-text font-semibold">Reason *</span>
                </label>
                <Controller
                  name="reasonId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`select select-bordered w-full ${
                        errors.reasonId ? "select-error" : ""
                      }`}
                    >
                      <option value="">Select a reason</option>
                      {blockReasons.map((reason) => (
                        <option key={reason.id} value={reason.id}>
                          {reason.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.reasonId && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.reasonId.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Comment */}
              <div className="flex w-full flex-col gap-2">
                <label className="label">
                  <span className="label-text font-semibold">Comment *</span>
                </label>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className={`textarea textarea-bordered h-24 w-full ${
                        errors.comment ? "textarea-error" : ""
                      }`}
                      placeholder="Enter a comment..."
                    />
                  )}
                />
                {errors.comment && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.comment.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Cancel Links */}
              <div className="form-control w-full">
                <label className="label cursor-pointer justify-start gap-2">
                  <Controller
                    name="cancelLinks"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="checkbox-secondary checkbox disabled:border-gray"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <span className="label-text">
                    Cancel all active referral links
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 mb-10 flex w-full gap-4">
              <button
                type="button"
                className="btn btn-ghost border-gray w-full shrink"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-warning w-full shrink border-0 text-white hover:brightness-110"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
