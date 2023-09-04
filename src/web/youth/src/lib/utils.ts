const isBuilding = global.process.env.CI === "true";

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
