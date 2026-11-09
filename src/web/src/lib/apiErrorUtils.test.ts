import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import { toLogSafeError } from "./apiErrorUtils";

describe("toLogSafeError — a caught request error is logged without its credentials", () => {
  test("an AxiosError keeps status, code and the API's own errors, nothing from the request", () => {
    const config = {
      url: "/opportunity/123/info?secret=1",
      headers: new AxiosHeaders({ Authorization: "Bearer top-secret" }),
    };
    const error = new AxiosError(
      "Request failed with status code 403",
      AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      {
        status: 403,
        statusText: "Forbidden",
        headers: {},
        config,
        data: { errors: [{ type: "SecurityException", message: "No access" }] },
      },
    );

    const safe = toLogSafeError(error);

    assert.deepEqual(safe, {
      name: "AxiosError",
      code: AxiosError.ERR_BAD_REQUEST,
      status: 403,
      message: "No access",
      apiErrors: [{ type: "SecurityException", message: "No access" }],
    });
    assert.ok(!JSON.stringify(safe).includes("top-secret"));
    assert.ok(!JSON.stringify(safe).includes("secret=1"));
  });

  test("a plain Error keeps its name, message and stack", () => {
    const safe = toLogSafeError(new RangeError("boom"));
    assert.equal(safe.name, "RangeError");
    assert.equal(safe.message, "boom");
    assert.equal(typeof safe.stack, "string");
  });

  test("anything else is stringified", () => {
    assert.deepEqual(toLogSafeError("nope"), { message: "nope" });
  });
});
