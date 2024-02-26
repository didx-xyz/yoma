const isBuilding = process.env.CI === "true";

export async function fetchClientEnv() {
  try {
    if (!isBuilding) {
      let resp: Response;
      if (typeof window === "undefined") {
        // Running on the server
        resp = await fetch("http://127.0.0.1:3000/api/config/client-env");
      } else {
        // Running in the browser
        resp = await fetch("/api/config/client-env");
      }
      if (resp.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await resp.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
      } else {
        console.error("Failed to fetch client environment variables");
      }
    }
    return {};
  } catch (error) {
    console.error("Error fetching client environment variables:", error);
  }
}

/* eslint-disable */
export function objectToFormData(
  obj: any,
  form?: FormData,
  namespace?: string,
): FormData {
  const formData = form || new FormData();

  for (const property in obj) {
    if (!obj.hasOwnProperty(property) || (!obj[property] && obj[property] != 0))
      continue;

    const formKey = namespace ? `${namespace}[${property}]` : property;

    if (Array.isArray(obj[property])) {
      obj[property].forEach((item: any, index: number) => {
        if (typeof item === "object" && item !== null) {
          objectToFormData(item, formData, `${formKey}[${index}]`);
        } else {
          formData.append(`${formKey}[${index}]`, item);
        }
      });
    } else if (
      typeof obj[property] === "object" &&
      obj[property] !== null &&
      !(obj[property] instanceof Date) &&
      !(obj[property] instanceof File)
    ) {
      objectToFormData(obj[property], formData, formKey);
    } else {
      formData.append(formKey, obj[property]);
    }
  }

  return formData;
}
/* eslint-enable */

// formats a date in the local timezone as string
export function toISOStringForTimezone(date: Date | null) {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -1);
}

export function toUTCDate(date: Date | null) {
  if (!date) return "";
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
    ),
  ).toISOString();
}

export function toUTCDateTime(date: Date | null) {
  if (!date) return "";
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  ).toISOString();
}

/**
 * This function checks if the provided URL is a relative URL (i.e., it starts with a '/').
 * If the URL is relative, it returns the URL as is. If not, it returns a default URL.
 * This is used to prevent potential security risks associated with using absolute URLs that could lead to malicious websites.
 *
 * @param {string | undefined} returnUrl - The URL to check. This could be undefined.
 * @param {string} defaultUrl - The default URL to return if returnUrl is not a relative URL. Defaults to "/organisations".
 * @returns {string} - The safe URL. This will be the returnUrl if it's a relative URL, or the defaultUrl otherwise.
 */
export function getSafeUrl(
  returnUrl: string | undefined,
  defaultUrl: string,
): string {
  return returnUrl?.startsWith("/") ? returnUrl : defaultUrl;
}
