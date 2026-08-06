import { useEffect, useId, useState } from "react";
import { IoMdWarning } from "react-icons/io";
import { BTN_DANGER, BTN_SECONDARY } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import FormCheckbox from "~/components/Common/FormCheckbox";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalBody,
  ModalHeader,
} from "~/components/Common/ModalChrome";
import {
  formatFinancialYearStartDate,
  type FinancialYearAssessment,
} from "~/lib/treasury/financialYear";

/**
 * The rollover guard. Shown before `PATCH /treasury` whenever the submitted financial-year
 * configuration is expected to move the financial year forward — or whenever that cannot be
 * determined client-side (see `lib/treasury/financialYear.ts`).
 *
 * A rollover zeroes the current-financial-year cumulatives for the Treasury *and every
 * organisation*, and cannot be undone. Confirmation is therefore explicit: the admin has to tick
 * the acknowledgement before the destructive action becomes available.
 */
export const TreasuryRolloverConfirmDialog: React.FC<{
  isOpen: boolean;
  assessment: FinancialYearAssessment | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, assessment, isSubmitting, onConfirm, onCancel }) => {
  const acknowledgeId = useId();
  const [acknowledged, setAcknowledged] = useState(false);

  // Never carry an acknowledgement over from a previous attempt.
  useEffect(() => {
    if (!isOpen) setAcknowledged(false);
  }, [isOpen]);

  return (
    <CustomModal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={!isSubmitting}
      onRequestClose={onCancel}
      className="md:max-h-[640px] md:max-w-[620px]"
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <ModalHeader
          title="Start a new financial year?"
          icon={<IoMdWarning className="text-yellow h-5 w-5" />}
          onClose={isSubmitting ? undefined : onCancel}
        />

        <ModalBody className="items-stretch bg-white text-sm">
          <FormMessage messageType={FormMessageType.Error}>
            This moves the financial year forward. Current-financial-year totals
            for the Treasury and <strong>every organisation</strong> will reset
            to zero. All-time totals are kept.{" "}
            <strong>This can&apos;t be undone.</strong>
          </FormMessage>

          {assessment?.isUncertain ? (
            <p className="text-gray-dark">
              We can&apos;t tell for certain whether this configuration starts a
              new financial year, so we&apos;re asking to be safe — the server
              makes the final decision when you save.
            </p>
          ) : (
            <dl className="border-gray-light divide-gray-light divide-y rounded-lg border">
              <div className="flex flex-row justify-between gap-4 px-4 py-2">
                <dt className="text-gray-dark">Financial year starts</dt>
                <dd className="text-right font-semibold">
                  {formatFinancialYearStartDate(assessment?.persistedStartDate)}
                </dd>
              </div>
              <div className="flex flex-row justify-between gap-4 px-4 py-2">
                <dt className="text-gray-dark">Will start</dt>
                <dd className="text-right font-semibold">
                  {formatFinancialYearStartDate(assessment?.candidateStartDate)}
                </dd>
              </div>
            </dl>
          )}

          <div>
            <p className="mb-1 font-semibold">What resets to zero</p>
            <ul className="text-gray-dark ml-5 list-disc">
              <li>ZLTO awarded this financial year, for the Treasury</li>
              <li>ZLTO awarded this financial year, for every organisation</li>
              <li>Payouts completed this financial year</li>
            </ul>
          </div>

          <div>
            <p className="mb-1 font-semibold">What stays as it is</p>
            <ul className="text-gray-dark ml-5 list-disc">
              <li>All-time totals</li>
              <li>The pools you have allocated</li>
              <li>
                Everything organisations, opportunities and referrals have
                configured
              </li>
            </ul>
          </div>

          <div className="bg-gray-light rounded-lg p-3">
            <FormCheckbox
              id={acknowledgeId}
              label="I understand these totals will reset to zero and this can't be undone."
              inputProps={{
                checked: acknowledged,
                disabled: isSubmitting,
                onChange: (event) => setAcknowledged(event.target.checked),
              }}
            />
          </div>
        </ModalBody>

        <ModalActions>
          <button
            type="button"
            className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${BTN_DANGER} ${MODAL_ACTION_WIDTH}`}
            onClick={onConfirm}
            disabled={!acknowledged || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save & reset"}
          </button>
        </ModalActions>
      </div>
    </CustomModal>
  );
};

export default TreasuryRolloverConfirmDialog;
