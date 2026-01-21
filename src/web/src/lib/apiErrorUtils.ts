import type { ErrorResponseItem } from "~/api/models/common";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorResponseItem(value: unknown): value is ErrorResponseItem {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    typeof value.message === "string"
  );
}

export function extractErrorResponseItems(data: unknown): ErrorResponseItem[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(isErrorResponseItem);
  }

  if (isRecord(data)) {
    const maybeErrors =
      data.errors ??
      data.Errors ??
      data.error ??
      data.Error ??
      data.details ??
      data.Details;

    if (Array.isArray(maybeErrors)) {
      return maybeErrors.filter(isErrorResponseItem);
    }

    // Some APIs return a single error object.
    if (isErrorResponseItem(maybeErrors)) {
      return [maybeErrors];
    }
  }

  return [];
}

export function extractErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;

  if (typeof data === "string") return data;

  if (isRecord(data)) {
    const message = data.message ?? data.Message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return undefined;
}

export function parseApiError(error: any): {
  status?: number;
  message?: string;
  errors: ErrorResponseItem[];
} {
  const status: number | undefined = error?.response?.status;
  const data: unknown = error?.response?.data;

  const errors = extractErrorResponseItems(data);
  const message =
    extractErrorMessage(data) ||
    (errors.length === 1 ? errors[0]?.message : undefined) ||
    (typeof error?.message === "string" ? error.message : undefined);

  return { status, message, errors };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
