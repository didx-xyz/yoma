import { TESTORGADMINUSER_EMAIL, TESTORGADMINUSER_PASSWORD } from "./constants";

// extend the context (this) to include a magicNumber property
declare global {
  namespace Mocha {
    interface Suite {
      magicNumber: number;
    }
  }
}

describe(`Opportunities`, function () {
  const magicNumber = Math.floor(Math.random() * 1000000);
  this.magicNumber = magicNumber;

  before(function () {
    // set a variable on the context object
    this.magicNumber = magicNumber;
  });

  describe(`${TESTORGADMINUSER_EMAIL} (OrganisationAdmin role)`, () => {
    beforeEach(() => {
      cy.login(TESTORGADMINUSER_EMAIL, TESTORGADMINUSER_PASSWORD);
    });

    it("should create an opportunity", function () {
      // visit the home page
      cy.visit("http://localhost:3000", {
        // stub the console log and error methods for console assertions
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
          cy.stub(win.console, "error").as("consoleError");
        },
      });
      cy.wait(10000);

      //* click on the first organisation link on the user menu
      cy.get(`button[id="btnUserMenu"]`).should("exist").click();
      cy.get(`#organisations a`).first().click();
      cy.wait(5000);

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
      cy.get(`button[id="btnNavbarMenu"]`).should("exist").click();
      cy.wait(200);
      cy.get(`a[id="lnkNavbarMenuModal_Opportunities"]`).first().click();
      cy.wait(6000);

      // href shoud be /organisations/guid/opportunities
      cy.get("@guid").then((guid) => {
        cy.location("href").should("eq", `http://localhost:3000/organisations/${guid}/opportunities`);
      });

      //* click on the create opportunity button
      cy.get(`a[id="btnCreateOpportunity"]`).should("exist").click();
      cy.wait(8000);

      // href should be /organisations/guid/opportunities/create
      cy.get("@guid").then((guid) => {
        cy.location("href").should("eq", `http://localhost:3000/organisations/${guid}/opportunities/create`);
      });

      //* step 1: fill out form and click next
      cy.get("input[name=title]").type(`Test Opportunity ${this.magicNumber}`);
      cy.get("input[id=input_typeid]").type("Learning{enter}");
      cy.get("input[id=input_categories]").type("Agriculture{enter}Business and Entrepreneurship{enter}");
      cy.get("input[name=uRL]").type(`https://www.testopportunity.com`);
      cy.get("textarea[name=description]").type("Lorem ipsum dolor sit amet, consectetuer adipiscing elit.");

      cy.get("button[type=submit]").should("exist").click();

      //* step 2: fill out form and click next
      cy.get("input[id=input_languages]").type("Afrikaans{enter}");
      cy.get("input[id=input_countries]").type("Botswana{enter}South Africa{enter}");
      cy.get("input[id=input_difficultyId]").type("Beginner{enter}");
      cy.get("input[name=commitmentIntervalCount]").type(`1`);
      cy.get("input[id=input_commitmentIntervalId]").type("Day{enter}");
      const today = new Date();
      cy.get("input[id=input_dateStart]").type(`${today.toISOString().slice(0, 10)}{enter}`);
      today.setDate(today.getDate() + 1);
      cy.get("input[id=input_dateEnd]").type(`${today.toISOString().slice(0, 10)}{enter}`);
      cy.get("input[name=participantLimit]").type(`1000`);

      cy.get("button[type=submit]").should("exist").click();

      //* step 3: fill out form and click next
      cy.get("input[name=yomaReward]").type(`1`);
      cy.get("input[name=zltoReward]").type(`2`);
      cy.get("input[id=input_skills]").type(".net assemblies{enter}10 Gigabit Ethernet{enter}3D Animation{enter}");

      cy.get("button[type=submit]").should("exist").click();

      //* step 4: fill out form and click next
      cy.get("input[id=input_keywords]").type("keyword1{enter}keyword2{enter}keyword3{enter}");

      cy.get("button[type=submit]").should("exist").click();

      //* step 5: fill out form and click next
      cy.get("button[type=submit]").should("exist").click();
      cy.get("input[id=verificationEnabledManual]").check();
      cy.get(`input[id="chk_verificationType_File Upload"]`).check();
      cy.get(`input[id="input_verificationType_File Upload"]`).type("2", { moveToEnd: true });
      cy.get(`input[id="chk_verificationType_Location"]`).check();
      cy.get(`input[id="input_verificationType_Location"]`).type("2", { moveToEnd: true });
      cy.get(`input[id="chk_verificationType_Picture"]`).check();
      cy.get(`input[id="input_verificationType_Picture"]`).type("2", { moveToEnd: true });
      cy.get(`input[id="chk_verificationType_Voice Note"]`).check();
      cy.get(`input[id="input_verificationType_Voice Note"]`).type("2", { moveToEnd: true });

      cy.get("button[type=submit]").should("exist").click();

      //* step 6: fill out form and click next
      cy.get("input[name=credentialIssuanceEnabled]").check();
      cy.wait(500);
      cy.get("input[id=input_ssiSchemaName]").type("Default{enter}");

      cy.get("button[type=submit]").should("exist").click();

      //* step 7: fill out form and click submit
      cy.get("input[name=postAsActive]").check();

      cy.get("button[type=submit]").should("exist").click();

      // assert toast message
      cy.get(".Toastify__toast-container").should("be.visible");
      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Opportunity created");

      // href shoud be /organisations/guid/opportunities
      cy.get("@guid").then((guid) => {
        cy.location("href").should("eq", `http://localhost:3000/organisations/${guid}/opportunities`);
      });
    });
  });
});
