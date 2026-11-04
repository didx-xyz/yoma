import { test as setup } from "@playwright/test";
import { ORGANISATIONS, ROUTES } from "./seed";

// Local only: the Next dev server compiles a route on its first request and falls over when
// several first requests arrive at once from parallel workers. Request each route once,
// sequentially, before the test projects start. The production image in CI needs none of this.
setup("warm up dev-server routes", async ({ request }) => {
  setup.skip(!!process.env.GITHUB_ACTIONS, "production build in CI");
  setup.setTimeout(10 * 60_000);

  const routes = [
    ROUTES.home,
    ROUTES.about,
    ROUTES.terms,
    ROUTES.marketplace,
    "/marketplace/za",
    ROUTES.discover,
    ROUTES.yoid,
    ROUTES.yoidCompleted,
    ROUTES.yoidPending,
    ROUTES.yoidSaved,
    ROUTES.yoidSkills,
    ROUTES.yoidPassport,
    ROUTES.yoidWallet,
    ROUTES.profile,
    ROUTES.settings,
    ROUTES.organisations,
    ROUTES.orgOpportunities(ORGANISATIONS.yoma.id),
    ROUTES.orgDashboard(ORGANISATIONS.yoma.id),
    "/admin",
    "/admin/connections",
    "/admin/skills",
    "/admin/links",
    "/admin/schemas",
    ROUTES.adminOpportunities,
    ROUTES.adminTreasury,
    "/this-route-does-not-exist",
  ];
  for (const route of routes) {
    // Status is irrelevant (401/403/404 still compile the page); only the compile matters.
    await request.get(route, { timeout: 120_000 });
  }
});
