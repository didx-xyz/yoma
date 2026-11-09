"""Run with Python's standard library on Linux with sh and jq; no live platforms are used.

The curl executable is replaced with a stateful HTTP-contract fixture. Tests exercise the
actual shell initializer, including reruns, readiness failure, drift and secret-safe output.
"""

import base64
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import parse_qs, urlsplit


SECRET = "fixture-secret-must-never-appear-in-output"
ISSUER = "http://keycloak:8080/realms/yoma"
AUDIENCE = "https://didx.127.0.0.1.nip.io/iam/realms/consumers"
JWKS = "http://host.docker.internal:8080/realms/yoma/protocol/openid-connect/certs"


def fake_curl():
    args = sys.argv[2:]
    state_path = Path(os.environ["FIXTURE_STATE"])
    state = json.loads(state_path.read_text())
    url = args[-1]
    path = urlsplit(url).path
    method = args[args.index("--request") + 1] if "--request" in args else "GET"
    payload = None
    if "--data-binary" in args:
        payload = Path(args[args.index("--data-binary") + 1][1:]).read_text()
    state.setdefault("calls", []).append([method, url])
    code, body = 200, {}
    mode = state.get("mode")
    if "--request" not in args:
        code = 503 if mode == "unavailable" else 200
    elif path.endswith("/.well-known/openid-configuration"):
        body = {"issuer": AUDIENCE} if "/consumers/" in path else {"issuer": ISSUER, "jwks_uri": ISSUER + "/protocol/openid-connect/certs"}
    elif path.endswith("/certs"):
        body = {"keys": [{"kid": "fixture"}]}
    elif path.endswith("/token"):
        form = parse_qs(payload)
        if form["client_id"] == ["yoma-me-creds"]:
            assert form["client_secret"] == [SECRET + "-issuer"]
            assert state["issuer_secret"] == SECRET + "-issuer"
        claims = base64.urlsafe_b64encode(json.dumps({"tenantAlias": "yoma", "aud": ["me-creds-api"]}).encode()).decode().rstrip("=")
        body = {"access_token": "e30." + claims + ".signature", "token_type": "Bearer"}
    elif path.endswith("/tenants/alias/yoma"):
        code = 200 if state.get("tenant") else 404
        body = {"tenantAlias": "yoma", "tenantName": "Yoma", "id": "tenant-id", "owner": "operator-id"}
    elif path.endswith("/product-hub/users"):
        if method == "POST":
            state["operator"] = True
            code = 201
        else:
            body = [{"id": "operator-id"}] if state.get("operator") else []
    elif path.endswith("/tenants"):
        assert method == "POST"
        state["tenant"] = True
        code = 201
    elif path.endswith("/federated-lite-clients"):
        if method == "POST":
            data = json.loads(payload)
            assert data["issuer"] == ISSUER and data["jwksUrl"] == JWKS
            state["holder"] = True
            state["holder_creates"] = state.get("holder_creates", 0) + 1
            code = 201
        else:
            body = {"liteClients": [{"id": "holder-id", "clientId": "yoma-federated-lite", "idpAlias": "yoma-idp", "clientSecret": state.get("holder_secret", SECRET + "-generated-holder")}] if state.get("holder") else []}
    elif path.endswith("/identity-provider/instances/yoma-idp"):
        body = {"enabled": True, "providerId": "jwt-authorization-grant", "config": {
            "issuer": "wrong-issuer" if mode == "drift" else ISSUER, "jwksUrl": JWKS,
            "useJwksUrl": "true", "jwtAuthorizationGrantEnabled": "true"}}
    elif path.endswith("/client-secret"):
        assert method == "GET", "Random secret rotation is not allowed"
        client = "holder" if "/consumers/" in path else "issuer"
        body = {"value": state.get(client + "_secret", SECRET + "-generated-" + client)}
    elif method == "PUT" and (path.endswith("/clients/holder-id") or path.endswith("/clients/issuer-id")):
        client = "holder" if "/consumers/" in path else "issuer"
        data = json.loads(payload)
        assert data == {"secret": SECRET + "-" + client}
        if mode == "secret-denied":
            code, body = 403, {"message": SECRET}
        else:
            state[client + "_updates"] = state.get(client + "_updates", 0) + 1
            if mode != "secret-not-applied":
                state[client + "_secret"] = data["secret"]
            code = 204
    elif path.endswith("/product-hub/clients/issuer-id"):
        body = {"clientId": "unrelated-client" if mode == "wrong-client" else "yoma-me-creds", "publicClient": False}
    elif path.endswith("/consumers/clients/holder-id"):
        body = {"clientId": "yoma-federated-lite", "enabled": True, "publicClient": False,
                "standardFlowEnabled": False, "directAccessGrantsEnabled": False, "serviceAccountsEnabled": False,
                "defaultClientScopes": ["basic", "profile", "email"],
                "attributes": {"oauth2.jwt.authorization.grant.enabled": "true", "oauth2.jwt.authorization.grant.idp": "yoma-idp"},
                "protocolMappers": [
                    {"protocolMapper": "oidc-hardcoded-claim-mapper", "config": {"claim.name": "tenantAlias", "claim.value": "yoma", "access.token.claim": "true"}},
                    {"protocolMapper": "oidc-audience-mapper", "config": {"included.custom.audience": "me-wallet-api", "access.token.claim": "true"}}]}
        if mode == "mapper-drift":
            body["protocolMappers"] = []
    elif path.endswith("/clients/yoma-me-creds"):
        code = 200 if state.get("issuer") else 404
        body = {"id": "issuer-id", "clientId": "yoma-me-creds", "tenantAlias": "yoma", "clientSecret": state.get("issuer_secret", SECRET + "-generated-issuer")}
    elif path.endswith("/clients"):
        assert method == "POST"
        state["issuer"] = True
        state["issuer_creates"] = state.get("issuer_creates", 0) + 1
        code = 201
    elif path.endswith("/service-registrations"):
        assert method == "POST"
        data = json.loads(payload)
        assert data["userId"] == "operator-id"
        assert data["tenantAlias"] == "yoma" and data["serviceName"] == "me-creds"
        assert data["issuerDisplay"]["displayName"] == "Yoma"
        if mode == "issuer-failure":
            code, body = 500, {"message": SECRET}
        else:
            state["project"] = True
            code, body = 201, {"tenantAlias": "yoma", "serviceName": "me-creds", "meCredsProjectId": "stable-project-id"}
    else:
        raise AssertionError("Unexpected fixture request: " + method + " " + path)
    state_path.write_text(json.dumps(state))
    output = args[args.index("--output") + 1]
    Path(output).write_text(json.dumps(body))
    print(code, end="")


class InitTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / "state.json"
        self.state.write_text("{}")
        self.settings = self.root / "appsettings.Local.json"
        self.original = {"DidxMe": {"RequestTimeoutSeconds": 17}, "External": {"Secret": SECRET + "-unrelated"}, "AppSettings": {"Other": "preserved"}}
        self.settings.write_text(json.dumps(self.original))
        curl = self.root / "curl"
        curl.write_text('#!/bin/sh\nexec python3 "' + str(Path(__file__).resolve()) + '" --fake-curl "$@"\n')
        curl.chmod(0o700)
        self.env = dict(os.environ, PATH=str(self.root) + os.pathsep + os.environ["PATH"],
                        FIXTURE_STATE=str(self.state), LOCAL_SETTINGS_FILE=str(self.settings),
                        YOMA_ENVIRONMENT="Local", YOMA_SSI_ENABLED_ENVIRONMENTS="Local", MONO_READY_TIMEOUT_SECONDS="10", YOMA_ASSERTION_CLIENT_SECRET=SECRET + "-assertion",
                        YOMA_ISSUER_CLIENT_SECRET=SECRET + "-issuer", YOMA_HOLDER_CLIENT_SECRET=SECRET + "-holder")

    def run_init(self, mode=None):
        if mode:
            state = json.loads(self.state.read_text())
            state["mode"] = mode
            self.state.write_text(json.dumps(state))
        result = subprocess.run(["sh", str(Path(__file__).with_name("init.sh"))], env=self.env,
                                capture_output=True, text=True, timeout=30)
        self.assertNotIn(SECRET, result.stdout + result.stderr)
        return result

    def test_fresh_setup_then_rerun_preserves_clients_secrets_and_other_settings(self):
        for _ in range(2):
            result = self.run_init()
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        settings = json.loads(self.settings.read_text())
        state = json.loads(self.state.read_text())
        self.assertEqual(1, state["holder_creates"])
        self.assertEqual(1, state["issuer_creates"])
        self.assertEqual(1, state["holder_updates"])
        self.assertEqual(1, state["issuer_updates"])
        self.assertTrue(state["project"])
        self.assertEqual(self.original["External"], settings["External"])
        self.assertEqual(self.original["AppSettings"], settings["AppSettings"])
        self.assertEqual(17, settings["DidxMe"]["RequestTimeoutSeconds"])
        self.assertEqual(SECRET + "-issuer", settings["DidxMe"]["Issuer"]["ClientSecret"])
        self.assertEqual(SECRET + "-holder", settings["DidxMe"]["Holder"]["ClientSecret"])
        self.assertEqual(SECRET + "-assertion", settings["DidxMe"]["TokenExchange"]["ClientSecret"])

    def test_mono_reset_restores_same_local_secrets(self):
        self.assertEqual(0, self.run_init().returncode)
        before = self.settings.read_text()
        self.state.write_text("{}")
        self.assertEqual(0, self.run_init().returncode)
        self.assertEqual(before, self.settings.read_text())

    def test_missing_fixed_secret_is_rejected_before_network_access(self):
        del self.env["YOMA_HOLDER_CLIENT_SECRET"]
        self.assertNotEqual(0, self.run_init().returncode)
        self.assertNotIn("calls", json.loads(self.state.read_text()))

    def test_secret_failure_blocks_settings_update(self):
        for mode in ["secret-denied", "secret-not-applied", "wrong-client"]:
            with self.subTest(mode=mode):
                self.state.write_text("{}")
                result = self.run_init(mode)
                self.assertNotEqual(0, result.returncode)
                self.assertEqual(self.original, json.loads(self.settings.read_text()))
                if mode == "wrong-client":
                    self.assertNotIn("issuer_updates", json.loads(self.state.read_text()))

    def test_unavailable_mono_has_bounded_wait_and_no_provisioning_or_settings_changes(self):
        self.env["MONO_READY_TIMEOUT_SECONDS"] = "1"
        result = self.run_init("unavailable")
        self.assertNotEqual(0, result.returncode)
        self.assertIn("Start mono separately", result.stdout)
        self.assertEqual(self.original, json.loads(self.settings.read_text()))
        self.assertTrue(all(method == "GET" for method, _ in json.loads(self.state.read_text())["calls"]))

    def test_non_local_environment_is_rejected_before_network_access(self):
        self.env["YOMA_ENVIRONMENT"] = "Development"
        result = self.run_init()
        self.assertNotEqual(0, result.returncode)
        self.assertIn("restricted to Local", result.stdout)
        self.assertNotIn("calls", json.loads(self.state.read_text()))

    def test_disabled_ssi_exits_before_settings_secrets_or_network_access(self):
        self.settings.unlink()
        del self.env["YOMA_ASSERTION_CLIENT_SECRET"]
        for environments in ["None", "Development, Staging, Production", " none , DEVELOPMENT "]:
            with self.subTest(environments=environments):
                self.env["YOMA_SSI_ENABLED_ENVIRONMENTS"] = environments
                result = self.run_init()
                self.assertEqual(0, result.returncode, result.stdout + result.stderr)
                self.assertIn("SSI is disabled locally", result.stdout)
                self.assertNotIn("calls", json.loads(self.state.read_text()))
                self.assertFalse(self.settings.exists())

    def test_missing_jq_fails_enabled_startup_but_does_not_block_disabled_ssi(self):
        tools = self.root / "tools"
        tools.mkdir()
        for name in ["sh", "tr", "sed"]:
            (tools / name).symlink_to(shutil.which(name))
        self.env["PATH"] = str(tools)
        self.settings.unlink()

        for environments, expected_code in [("Local", 1), ("None", 0)]:
            with self.subTest(environments=environments):
                self.env["YOMA_SSI_ENABLED_ENVIRONMENTS"] = environments
                result = self.run_init()
                self.assertEqual(expected_code, result.returncode, result.stdout + result.stderr)
                self.assertIn("jq is missing" if expected_code else "SSI is disabled locally", result.stdout)
                self.assertNotIn("calls", json.loads(self.state.read_text()))
                self.assertFalse(self.settings.exists())

    def test_unsupported_ssi_environment_is_rejected_before_settings_or_network_access(self):
        self.settings.unlink()
        for environments in ["Unsupported", "Local, Unsupported", "None, Unsupported"]:
            with self.subTest(environments=environments):
                self.env["YOMA_SSI_ENABLED_ENVIRONMENTS"] = environments
                result = self.run_init()
                self.assertNotEqual(0, result.returncode)
                self.assertIn("unsupported environment", result.stdout)
                self.assertNotIn("calls", json.loads(self.state.read_text()))
                self.assertFalse(self.settings.exists())

    def test_drift_and_provider_failure_block_settings_update_without_exposing_secrets(self):
        for mode in ["drift", "mapper-drift", "issuer-failure"]:
            with self.subTest(mode=mode):
                result = self.run_init(mode)
                self.assertNotEqual(0, result.returncode)
                self.assertIn("API startup is blocked", result.stdout)
                self.assertEqual(self.original, json.loads(self.settings.read_text()))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--fake-curl":
        fake_curl()
    else:
        unittest.main()
