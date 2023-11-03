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
        console.debug("Client environment variables:", data);
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
