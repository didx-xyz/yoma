import axios from "axios";
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

export function formatApiErrorMessage(
  error: any,
  fallbackMessage: string | null = null,
): string | null {
  const { errors, message } = parseApiError(error);

  return (
    errors
      .map((errorItem) => errorItem.message)
      .filter(Boolean)
      .join(" · ") ||
    message ||
    fallbackMessage
  );
}

/**
 * The fields of a caught error that may be written to a log or forwarded to telemetry. An
 * AxiosError carries its request config (URL, headers with the bearer token) and the whole
 * response, so it must never be logged as-is; log this instead.
 */
export function toLogSafeError(error: unknown): Record<string, unknown> {
  if (axios.isAxiosError(error)) {
    const { status, message, errors } = parseApiError(error);
    return {
      name: error.name,
      code: error.code,
      status,
      message,
      apiErrors: errors.map(({ type, message }) => ({ type, message })),
    };
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  return { message: String(error) };
}
