import { Fragment } from "react";
import {
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { IoMdWarning } from "react-icons/io";
import { CSVImportResult, CSVImportErrorType } from "~/api/models/common";

interface CSVImportResultsProps {
  result: CSVImportResult;
  importType: "opportunities" | "submissions";
}

export const CSVImportResults: React.FC<CSVImportResultsProps> = ({
  result,
  importType,
}) => {
  const hasErrors = Boolean(result.headerErrors || result.recordsFailed > 0);
  const headerText = result.imported
    ? "Import Completed"
    : hasErrors
      ? "Validation Failed"
      : "Validation Passed";
  const subText = result.imported
    ? `Your ${importType} CSV was imported successfully.`
    : hasErrors
      ? `The following issues were found in your ${importType} CSV. Please fix all errors before submitting.`
      : `No blocking issues were found in your ${importType} CSV. You can proceed to Submit when ready.`;
  const statusIcon = result.imported ? (
    <IoCheckmarkCircleOutline className="h-6 w-6 text-white" />
  ) : hasErrors ? (
    <IoWarningOutline className="h-6 w-6 text-white" />
  ) : (
    <IoCheckmarkCircleOutline className="h-6 w-6 text-white" />
  );

  return (
    <div
      className={`bg-base-100 w-full rounded-xl border p-4 shadow-sm ${
        result.imported
          ? "border-success/40"
          : hasErrors
            ? "border-error/40"
            : "border-info/40"
      }`}
    >
      <span className="w-full text-xs">
        {/* Status header */}
        <div
          role="alert"
          className={`alert mb-2 ${
            result.imported
              ? "alert-success"
              : hasErrors
                ? "alert-error"
                : "alert-info"
          }`}
        >
          <div className="flex items-start gap-3">
            {statusIcon}
            <div>
              <div className="text-sm font-semibold">{headerText}</div>
              <div className="text-xs tracking-wide opacity-90">{subText}</div>
            </div>
          </div>
        </div>

        {/* Record summary */}
        {(!result.headerErrors || result.imported) && (
          <div className="mt-6">
            <div className="text-base-content/80 mb-2 flex items-center gap-2 text-sm font-semibold">
              <IoInformationCircleOutline className="text-info h-5 w-5 shrink-0" />
              <span className="leading-none">Import Summary</span>
            </div>
            <div className="stats rounded-box bg-base-200/40 w-full shadow-inner">
              <div className="stat">
                <div className="stat-title">Total Records</div>
                <div className="stat-value text-primary text-2xl">
                  {result.recordsTotal}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Succeeded</div>
                <div className="stat-value text-success text-2xl">
                  {result.recordsSucceeded}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Failed</div>
                <div className="stat-value text-warning text-2xl">
                  {result.recordsFailed}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors && result.errors.length > 0 && (
          <div className="mt-4">
            <div className="text-base-content/80 mb-2 flex items-center gap-2 text-sm font-semibold">
              <IoWarningOutline className="text-warning h-5 w-5 shrink-0" />
              Errors
            </div>
            <ul className="list rounded-box border-base-200 bg-base-100 border shadow-md">
              {result.errors.map((row, rIdx) => (
                <Fragment key={`row_${rIdx}`}>
                  {/* Row header */}
                  <li className="border-base-200 bg-base-200/50 flex items-center justify-between border-b px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase opacity-80">
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
                        <div className="text-xs font-medium">{it.message}</div>
                        {(it.field || it.value) && (
                          <div className="mt-1 flex flex-col gap-1 text-xs opacity-60">
                            {it.field && (
                              <span>
                                <strong>Field:</strong> <code>{it.field}</code>
                              </span>
                            )}
                            {it.value && (
                              <span>
                                <strong>Value:</strong> <code>{it.value}</code>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className={`badge text-xs ${
                          it.type === CSVImportErrorType.ProcessingError
                            ? "badge-warning"
                            : it.type ===
                                  CSVImportErrorType.InvalidFieldValue ||
                                it.type ===
                                  CSVImportErrorType.RequiredFieldMissing
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
      </span>
    </div>
  );
};
