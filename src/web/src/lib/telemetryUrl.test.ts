import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { telemetryOrigin } from "./telemetryUrl";

describe("telemetryOrigin — analytics keep the partner's origin, never the login token", () => {
  test("a pre-authenticated hand-off URL is reduced to its origin", () => {
    const destination =
      "https://partner.example.com/sso/login?token=eyJhbGciOi.SECRET.sig&user=42#access_token=also-secret";
    const kept = telemetryOrigin(destination);

    assert.equal(kept, "https://partner.example.com");
    for (const secret of ["SECRET", "also-secret", "user=42", "/sso/login"])
      assert.ok(!kept!.includes(secret), `${secret} must not reach telemetry`);
  });

  test("port and scheme survive; userinfo does not", () => {
    assert.equal(
      telemetryOrigin("http://alice:hunter2@localhost:3001/x?y=1"),
      "http://localhost:3001",
    );
  });

  test("anything that is not an absolute http(s) URL yields nothing", () => {
    assert.equal(telemetryOrigin("javascript:alert(1)"), null);
    assert.equal(telemetryOrigin("/relative?token=x"), null);
    assert.equal(telemetryOrigin(""), null);
    assert.equal(telemetryOrigin(null), null);
  });
});
