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

export function toISOStringWithTimezone(date: Date) {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? "+" : "-";
  const pad = function (num: number) {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? "0" : "") + norm;
  };

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    dif +
    pad(tzo / 60) +
    ":" +
    pad(tzo % 60)
  );
}
