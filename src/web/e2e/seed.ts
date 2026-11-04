// Deterministic seeded data the e2e suite relies on.
//
// Source of truth: src/api/cicd/scripts/postgressql-init/post.sql (DB) and the
// keycloak-users service in src/api/docker-compose.yml (Keycloak accounts). The seed is
// applied to a fresh database on `docker compose up`; local stacks need
// `docker compose down -v` to pick up seed changes. Everything not listed here
// (other organisations, bulk opportunities, referral programs) is generated at seed
// time with random ids/names and must not be asserted on.
//
// Keep this file and post.sql in sync — the NOTE at the top of post.sql points here.

export type Role = "youth" | "orgAdmin" | "admin";

export interface SeedUser {
  email: string;
  password: string;
  /** "Entity"."User"."Id" */
  id: string;
  /** "Entity"."User"."DisplayName" */
  displayName: string;
  /** "Entity"."User"."FirstName" */
  firstName: string;
  /** Keycloak realm roles (src/keycloak/scripts/users.sh) */
  roles: string[];
}

// Passwords: docker-compose.yml keycloak-users service. Not secrets — local/CI seed only.
const PASSWORD = "P@ssword12";

export const USERS: Record<Role, SeedUser> = {
  // post.sql "testuser@gmail.com": roles User
  youth: {
    email: "testuser@gmail.com",
    password: PASSWORD,
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Test User",
    firstName: "Test",
    roles: ["User"],
  },
  // post.sql "testadminuser@gmail.com": roles Admin, User; administers no organisation
  admin: {
    email: "testadminuser@gmail.com",
    password: PASSWORD,
    id: "00000000-0000-4000-8000-000000000002",
    displayName: "Test Admin User",
    firstName: "Test Admin",
    roles: ["Admin", "User"],
  },
  // post.sql "testorgadminuser@gmail.com": roles OrganisationAdmin, User; admin of every seeded organisation
  orgAdmin: {
    email: "testorgadminuser@gmail.com",
    password: PASSWORD,
    id: "00000000-0000-4000-8000-000000000003",
    displayName: "Test Organization Admin User",
    firstName: "Test Organization Admin",
    roles: ["OrganisationAdmin", "User"],
  },
};

export interface SeedOrganisation {
  /** "Entity"."Organization"."Id" */
  id: string;
  name: string;
  /** Country CodeAlpha2 */
  country: string;
}

// All Active. The org admin user is an admin of each of them.
export const ORGANISATIONS = {
  // post.sql "Yoma (Youth Agency Marketplace) organization"; owns the 24 search fixtures
  yoma: {
    id: "00000000-0000-4000-8000-000000000100",
    name: "Yoma (Youth Agency Marketplace)",
    country: "ZA",
  },
  // post.sql partner organisations (fixed ids, present in every environment)
  jobbermanNigeria: {
    id: "019df6f6-9422-76bb-b382-0e2c65c9006e",
    name: "Jobberman - Nigeria",
    country: "NG",
  },
  jobbermanGhana: {
    id: "019df6ff-428e-73b1-9fe7-11ca6fdad88b",
    name: "Jobberman - Ghana",
    country: "GH",
  },
  jobJack: {
    id: "019fc83e-9ff2-7ba2-adbf-c7cbd6bc085e",
    name: "JobJack",
    country: "ZA",
  },
  alison: {
    id: "019e01cd-8ee7-757e-9945-67fec6a73e81",
    name: "Alison",
    country: "IE",
  },
  ixo: {
    id: "3538e529-16a2-42a0-86b2-c4b85e538e0c",
    name: "IXO",
    country: "ZA",
  },
  umuzi: {
    id: "b7838234-9aab-4b12-b6af-f921ec6c9d47",
    name: "Umuzi",
    country: "ZA",
  },
} satisfies Record<string, SeedOrganisation>;

// Search fixtures: post.sql "SearchFixtures". Titles are "NN - Type" (plus
// " (incomplete partner-like)" when NN % 3 == 0 or NN == 11). Ids are random; address them by
// title. All belong to ORGANISATIONS.yoma. Dates are relative to the seed run:
// 07 has ended, 08 starts in 30 days, 09 has no end date.
export const FIXTURE_TITLE = (
  number: number,
  type: string,
  incomplete = false,
) =>
  `${String(number).padStart(2, "0")} - ${type}${incomplete ? " (incomplete partner-like)" : ""}`;

export const FIXTURES = {
  // Job, USD 1 000/month, on-site ~5 km from Cape Town; youth has a completed placement
  job01: FIXTURE_TITLE(1, "Job"),
  job02: FIXTURE_TITLE(2, "Job"),
  // Event with "Available on request" accommodations; youth has a Pending verification
  event04: FIXTURE_TITLE(4, "Event"),
  learning07Ended: FIXTURE_TITLE(7, "Learning"),
  event08Future: FIXTURE_TITLE(8, "Event"),
  entrepreneurship09NoEnd: FIXTURE_TITLE(9, "Entrepreneurship"),
  impactAction11Incomplete: FIXTURE_TITLE(11, "ImpactAction", true),
};

// Routes the journeys use. Keep in step with src/web/src/lib/constants.ts and pages/.
export const ROUTES = {
  home: "/",
  about: "/about",
  terms: "/terms",
  marketplace: "/marketplace",
  yoid: "/yoid",
  yoidCompleted: "/yoid/opportunities/completed",
  yoidPending: "/yoid/opportunities/pending",
  yoidSaved: "/yoid/opportunities/saved",
  yoidSkills: "/yoid/skills",
  yoidPassport: "/yoid/passport",
  yoidWallet: "/yoid/wallet",
  profile: "/user/profile",
  settings: "/user/settings",
  discover: "/opportunities/discover",
  organisations: "/organisations",
  orgOpportunities: (orgId: string) => `/organisations/${orgId}/opportunities`,
  orgDashboard: (orgId: string) =>
    `/organisations/dashboard?organisations=${orgId}`,
  adminOpportunities: "/admin/opportunities",
  adminTreasury: "/admin/treasury",
};

// Keycloak (src/api/docker-compose.yml keycloak service, src/keycloak/exports/01-yoma-realm.yaml).
export const KEYCLOAK = {
  // The browser is redirected to this host; it must resolve on the test machine (/etc/hosts).
  url: process.env.E2E_KEYCLOAK_URL ?? "http://keycloak:8080",
  realm: "yoma",
  // Master-realm admin used only to clean up throw-away users and brute-force counters.
  admin: { username: "admin", password: "password" },
  // TEST_PHONE_NUMBERS: SMS is skipped and the OTP is always 1234. Abuse limits still apply:
  // one send per code type per 5 minutes, three per code type per hour.
  testPhone: "+27123456789",
  testOtp: "1234",
  // realm supportedLocales; default en
  locales: ["en", "fr", "es", "pt", "sw"],
};
