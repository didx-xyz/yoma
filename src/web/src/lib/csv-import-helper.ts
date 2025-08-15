import { CSVImportResult, CSVImportErrorType } from "~/api/models/common";

// Normalize any API response/error into a consistent CSVImportResult
export const toCSVResult = (
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
            type: CSVImportErrorType.ProcessingError,
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
