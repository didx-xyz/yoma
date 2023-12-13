import {
  TESTUSER_EMAIL,
  TESTUSER_PASSWORD,
  TESTADMINUSER_EMAIL,
  TESTADMINUSER_PASSWORD,
  TESTORGADMINUSER_EMAIL,
  TESTORGADMINUSER_PASSWORD,
  OPPORTUNITY_TYPE_LEARNING_ID,
} from "./constants";

describe(`Opportunities`, function () {
  const magicNumber = Math.floor(Math.random() * 1000000);
  this.magicNumber = magicNumber;

  before(function () {
    // set a variable on the context object
    this.magicNumber = magicNumber;
  });

  describe(`Role=OrgAdmin (${TESTORGADMINUSER_EMAIL})`, () => {
    beforeEach(() => {
      cy.login(TESTORGADMINUSER_EMAIL, TESTORGADMINUSER_PASSWORD);
    });

    it("create an opportunity", function () {
      // visit the home page
      cy.visit("http://localhost:3000", {
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
          cy.stub(win.console, "error").as("consoleError");
        },
      });
      cy.wait(500);

      //* click on the first organisation link on the user menu
      cy.get(`button[id="btnUserMenu`).should("exist").click();
      cy.get(`#organisations a`).first().click();
      cy.wait(1000);

      // href should end with /organisations/guid
      cy.location("href").then((href) => {
        const match = href.match(/\/organisations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/);
        if (match) {
          // store the organisation guid in an alias
          cy.wrap(match[1]).as("guid");
        } else {
          throw new Error("Organisation guid not found in href");
        }
      });

      //* click on the opportunities link on the navigation menu
      cy.get(`button[id="btnNavbarMenu`).should("exist").click();
      cy.wait(200);
      cy.get(`a[id="lnkNavbarMenuModal_Opportunities"]`).first().click();
      cy.wait(3000);

      // href shoud be /organisations/guid/opportunities
      cy.get("@guid").then((guid) => {
        cy.location("href").should("eq", `http://localhost:3000/organisations/${guid}/opportunities`);
      });

      //* click on the create opportunity button
      cy.get(`a[id="btnCreateOpportunity`).should("exist").click();

      // href should be /organisations/guid/opportunities/create
      cy.get("@guid").then((guid) => {
        cy.location("href").should("eq", `http://localhost:3000/organisations/${guid}/opportunities/create`);
      });

      //* step 1: fill out form and click next
      cy.get("input[name=title]").type(`Test Opportunity ${this.magicNumber}`);
      cy.get("input[name=typeId]").type(OPPORTUNITY_TYPE_LEARNING_ID);
      //cy.get("input[name=countryId]").select("a0d029b2-49ca-4e89-81aa-8d06be5d2241");

      // cy.get("textarea[name=description]").type("Test Opportunity Description");
      // cy.get("input[name=location]").type("Test Opportunity Location");
      // cy.get("input[name=startDate]").type("2021-01-01");
      // cy.get("input[name=endDate]").type("2021-01-02");
      // cy.get("input[name=startTime]").type("10:00");
      // cy.get("input[name=endTime]").type("11:00");

      // //* click on the organisation on the organisations page
      // cy.get(`a[id="lnkOrganisation_${this.organisationName} updated"]`).should("exist").click();
      // cy.wait(2500);

      // // href should end with /verify
      // cy.location("href").should("match", /\/verify$/);

      // // open approve dialog
      // cy.get(`button[id="btnApprove"]`).should("exist").click();

      // // enter comments into textarea
      // cy.get(`textarea[id="txtVerifyComments"]`).should("exist").type("Approved by admin user");

      // // approve the organisation by clicking on approve button
      // cy.get(`button[id="btnApproveModal"]`).should("exist").click();

      // // assert toast message
      // cy.get(".Toastify__toast-container").should("be.visible");
      // // assert console with the expected message
      // cy.get("@consoleLog").should("be.calledWith", "Organisation approved");

      // // href should end with /organisations
      // cy.location("href").should("match", /\/organisations$/);
    });
  });
});
