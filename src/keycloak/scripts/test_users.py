"""Exercise users.sh with fake HTTP on Linux (Python stdlib, sh and jq only).

No running Keycloak or database is contacted. Also checks fixture IDs against post.sql.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import parse_qs, urlsplit


SECRET = 'fixture-password&with="special"+characters'
TOKEN = "fixture-token-not-for-logs"
ACCOUNTS = {
    "TEST_USER": "testuser@gmail.com",
    "ADMIN_USER": "testadminuser@gmail.com",
    "ORG_ADMIN_USER": "testorgadminuser@gmail.com",
    "YOMA_SYSTEM_USER": "system@yoma.world",
}


def fake_curl():
    args = sys.argv[2:]
    state_file = Path(os.environ["FIXTURE_STATE"])
    state = json.loads(state_file.read_text())
    path = urlsplit(args[-1]).path
    state.setdefault("paths", []).append(path)
    mode = state.get("mode")
    code = 0
    status = 200
    if path.endswith("/token"):
        form = parse_qs(Path(args[args.index("--data-binary") + 1][1:]).read_text())
        assert form["password"] == [SECRET]
        body = {"access_token": TOKEN} if mode != "no-token" else {}
    else:
        header = args[args.index("--header") + 1]
        assert Path(header[1:]).read_text() == f"Authorization: Bearer {TOKEN}\n"
        if path.endswith("/partialImport"):
            payload = json.loads(Path(args[args.index("--data-binary") + 1][1:]).read_text())
            assert payload["ifResourceExists"] == "FAIL"
            state["users"] = payload["users"]
            body = {"added": len(payload["users"])}
            if mode == "forbidden":
                code = 22
            if mode == "wrong-count":
                body["added"] = 0
        else:
            user = next((user for user in state.get("users", []) if path.endswith("/" + user["id"])), None)
            status = 200 if user else 404
            body = {"id": user["id"], "username": user["username"]} if user else {}
            if user and mode == "wrong-id":
                body["id"] = "unexpected-generated-id"
            if mode == "lookup-forbidden":
                status = 403
            if mode == "lookup-failure":
                code = 7
    if "--write-out" in args:
        print(status, end="")
    elif "--fail" in args and status >= 400:
        code = 22
    state_file.write_text(json.dumps(state))
    if not code:
        Path(args[args.index("--output") + 1]).write_text(json.dumps(body))
    return code


class UserSeedTests(unittest.TestCase):
    def run_seed(self, mode="success", accounts=None, users=None):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            (work / "curl").write_text(f'#!/bin/sh\nexec "{sys.executable}" "{Path(__file__).resolve()}" curl "$@"\n')
            (work / "curl").chmod(0o700)
            state_file = work / "state.json"
            state_file.write_text(json.dumps({"mode": mode, "users": users or []}))
            env = {**os.environ, "PATH": f'{work}:{os.environ["PATH"]}',
                   "FIXTURE_STATE": str(state_file), "KC_BASE_URL": "http://fixture.invalid",
                   "KC_REALM": "yoma", "KC_CLIENT_ID": "admin-cli", "KC_ADMIN_USER": "admin",
                   "KC_ADMIN_PASSWORD": SECRET}
            for name in ACCOUNTS:
                env.pop(name, None)
                env.pop(name + "_PASSWORD", None)
            for name, username in (ACCOUNTS if accounts is None else accounts).items():
                env[name] = username
                env[name + "_PASSWORD"] = SECRET
            result = subprocess.run(["sh", str(Path(__file__).with_name("users.sh"))],
                                    env=env, capture_output=True, text=True)
            self.assertNotIn(SECRET, result.stdout + result.stderr)
            self.assertNotIn(TOKEN, result.stdout + result.stderr)
            return result, json.loads(state_file.read_text())

    def test_imports_fixed_ids_roles_attributes_and_matches_sql(self):
        result, state = self.run_seed()
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(10, len(state["paths"]))
        self.assertEqual(4, len({user["id"] for user in state["users"]}))
        sql = Path(os.environ.get("FIXTURE_POST_SQL", Path(__file__).resolve().parents[2] /
                                 "api/cicd/scripts/postgressql-init/post.sql")).read_text()
        for user in state["users"]:
            self.assertRegex(user["id"], r"^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$")
            self.assertEqual(SECRET, user["credentials"][0]["value"])
            self.assertIn("default-roles-yoma", user["realmRoles"])
            self.assertIn("User", user["realmRoles"])
            self.assertTrue(user["enabled"])
            self.assertTrue(user["emailVerified"])
            if user["username"] == ACCOUNTS["YOMA_SYSTEM_USER"]:
                self.assertIn('SET "ExternalId" = ' + "'" + user["id"] + "'", sql)
            else:
                statement = next(part for part in sql.split(";") if "VALUES(gen_random_uuid(), '" + user["username"] + "'" in part)
                self.assertIn("(CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), '" + user["id"] + "', TRUE", statement)
        by_name = {user["username"]: user for user in state["users"]}
        self.assertIn("Admin", by_name[ACCOUNTS["ADMIN_USER"]]["realmRoles"])
        self.assertIn("OrganisationAdmin", by_name[ACCOUNTS["ORG_ADMIN_USER"]]["realmRoles"])
        self.assertEqual(["+27821234567"], by_name[ACCOUNTS["TEST_USER"]]["attributes"]["phoneNumber"])

    def test_import_failures_or_identity_mismatch_fail_setup(self):
        for mode in ["forbidden", "no-token", "wrong-count", "wrong-id"]:
            with self.subTest(mode=mode):
                result, _ = self.run_seed(mode)
                self.assertNotEqual(0, result.returncode)
                self.assertNotIn("fixed IDs verified", result.stdout)

    def test_unconfigured_users_are_not_created(self):
        result, state = self.run_seed(accounts={})
        self.assertEqual(0, result.returncode)
        self.assertNotIn("paths", state)
        result, state = self.run_seed(accounts={"TEST_USER": ACCOUNTS["TEST_USER"]})
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(1, len(state["users"]))

    def test_restart_preserves_existing_users_without_import(self):
        _, initial = self.run_seed()
        result, state = self.run_seed(users=initial["users"])
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("import skipped", result.stdout)
        self.assertFalse(any(path.endswith("/partialImport") for path in state["paths"]))
        self.assertEqual(initial["users"], state["users"])

    def test_partial_or_conflicting_state_does_not_import(self):
        _, initial = self.run_seed()
        mismatched = json.loads(json.dumps(initial["users"]))
        mismatched[0]["username"] = "different@example.invalid"
        for users in [initial["users"][:1], mismatched]:
            with self.subTest(users=len(users)):
                result, state = self.run_seed(users=users)
                self.assertNotEqual(0, result.returncode)
                self.assertFalse(any(path.endswith("/partialImport") for path in state["paths"]))

    def test_lookup_errors_do_not_import(self):
        for mode in ["lookup-forbidden", "lookup-failure"]:
            with self.subTest(mode=mode):
                result, state = self.run_seed(mode)
                self.assertNotEqual(0, result.returncode)
                self.assertFalse(any(path.endswith("/partialImport") for path in state["paths"]))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "curl":
        sys.exit(fake_curl())
    unittest.main()
