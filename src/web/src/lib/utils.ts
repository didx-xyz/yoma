import type { Session } from "next-auth";
import {
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
  THEME_PURPLE,
} from "./constants";

const isBuilding = process.env.CI === "true";

export async function fetchClientEnv() {
  try {
    if (!isBuilding) {
      let resp: Response;
      if (typeof window === "undefined") {
        // Running on the server
        resp = await fetch(`${process.env.NEXTAUTH_URL}/api/config/client-env`);
      } else {
        // Running in the browser
        resp = await fetch("/api/config/client-env");
      }
      if (resp.ok) {
        const data = await resp.json();
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

function appendToFormData(
  formData: FormData,
  key: string,
  value: any,
  useIndexer: boolean,
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const arrayKey = useIndexer ? `${key}[${index}]` : key;
      appendToFormData(formData, arrayKey, item, useIndexer);
    });
  } else if (value instanceof File) {
    formData.append(key, value, value.name);
  } else if (typeof value === "object" && value !== null) {
    for (const subProperty in value) {
      if (value.hasOwnProperty(subProperty)) {
        const nestedKey = `${key}[${subProperty}]`;
        appendToFormData(formData, nestedKey, value[subProperty], useIndexer);
      }
    }
  } else {
    formData.append(key, value);
  }
}

export function objectToFormData(
  obj: any,
  form?: FormData,
  namespace?: string,
  useIndexer: boolean = true,
): FormData {
  const formData = form || new FormData();

  for (const property in obj) {
    if (
      !obj.hasOwnProperty(property) ||
      (!obj[property] && obj[property] !== 0)
    ) {
      continue;
    }

    const formKey = namespace ? `${namespace}[${property}]` : property;
    appendToFormData(formData, formKey, obj[property], useIndexer);
  }

  return formData;
}

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

export function normalizeDate(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
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

// This function determines the theme to be used based on the user's role and optional organisation ID.
export function getThemeFromRole(
  session: Session,
  organisationId?: string,
): string {
  let theme = THEME_PURPLE;

  if (organisationId) {
    if (session?.user?.adminsOf?.includes(organisationId)) theme = THEME_GREEN;
    if (session?.user?.roles.includes(ROLE_ADMIN)) theme = THEME_BLUE;
  } else {
    if (session?.user?.roles.includes(ROLE_ADMIN)) theme = THEME_BLUE;
    else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) theme = THEME_GREEN;
  }

  return theme;
}

export const debounce = function (
  this: any,
  func: (...args: any[]) => void,
  delay: number,
): (...args: any[]) => void {
  let debounceTimer: NodeJS.Timeout;
  return function (this: any, ...args: any[]): void {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
};

export const getTimeOfDayAndEmoji = (): [string, string] => {
  const hour = new Date().getHours();
  let timeOfDay: string;
  let timeOfDayEmoji: string;

  if (hour < 12) {
    timeOfDay = "morning";
    timeOfDayEmoji = "☀️";
  } else if (hour < 18) {
    timeOfDay = "afternoon";
    timeOfDayEmoji = "☀️";
  } else {
    timeOfDay = "evening";
    timeOfDayEmoji = "🌙";
  }

  return [timeOfDay, timeOfDayEmoji];
};
