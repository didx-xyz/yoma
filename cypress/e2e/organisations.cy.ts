import {
  TESTUSER_EMAIL,
  TESTUSER_PASSWORD,
  TESTADMINUSER_EMAIL,
  TESTADMINUSER_PASSWORD,
  COUNTRY_ID,
  COUNTRY_ID2,
  PROVIDER_TYPE_IMPACT_ID,
  PROVIDER_TYPE_EDUCATION_ID,
} from "./constants";

// extend the context (this) to include a magicNumber property
declare global {
  namespace Mocha {
    interface Suite {
      magicNumber: number;
    }
  }
  namespace Cypress {
    interface TypeOptions {
      moveToEnd: boolean;
    }
  }
}

describe(`Organisation Registration & Approval`, function () {
  const magicNumber = Math.floor(Math.random() * 1000000);
  this.magicNumber = magicNumber;

  before(function () {
    // set a variable on the context object
    this.magicNumber = magicNumber;
  });

  describe(`${TESTUSER_EMAIL} (User role)`, () => {
    beforeEach(() => {
      cy.login(TESTUSER_EMAIL, TESTUSER_PASSWORD);
    });

    it("should register an organisation", function () {
      // visit the registration page
      cy.visit("http://localhost:3000/organisations/register", {
        // stub the console log and error methods for console assertions
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
          cy.stub(win.console, "error").as("consoleError");
        },
      });
      cy.wait(500);

      //* step 1: fill out form and click next
      cy.get("input[name=name]").type(`Test Organisation ${this.magicNumber}`);
      cy.get("textarea[name=streetAddress]").type("123 Fake Street");
      cy.get("input[name=province]").type("Bogusville");
      cy.get("input[name=city]").type("Fake City");
      cy.get("select[name=countryId]").select(COUNTRY_ID);
      cy.get("input[name=postalCode]").type("1234");
      cy.get("input[name=websiteURL]").type("http://www.google.com");
      cy.fixture("org_logo.png").then((fileContent) => {
        cy.get("input[type=file][name=logo]").attachFile({
          fileContent: fileContent.toString(),
          fileName: "org_logo.png",
          mimeType: "image/png",
        });
      });
      cy.get("input[name=tagline]").type("Lorem ipsum dolor sit amet, consectetuer adipiscing elit.");
      cy.get("textarea[name=biography]").type(
        "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa."
      );

      cy.wait(500);
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(500);

      //* step 2: fill out form and click next
      cy.get(`input[type=checkbox][name=providerTypes][value="${PROVIDER_TYPE_IMPACT_ID}"]`).check(); //  check the "Impact" checkbox

      cy.fixture("dummy.pdf").then((fileContent) => {
        cy.get("input[type=file][name=registration]").attachFile({
          fileContent: fileContent.toString(),
          fileName: "dummy.pdf",
          mimeType: "application/pdf",
        });
      });

      cy.wait(500);
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(500);

      //* step 3: click submit
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(14000);

      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Organisation registered");

      // href should be /organisations/register/success
      cy.location("href").should("eq", "http://localhost:3000/organisations/register/success");
    });

    it("should edit an organisation", function () {
      // visit the home page
      cy.visit("http://localhost:3000/", {
        // stub the console log and error methods for console assertions
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
          cy.stub(win.console, "error").as("consoleError");
        },
      });
      cy.wait(500);

      //* click on the organisation on the user menu
      cy.get(`button[id="btnUserMenu`).first().click();
      cy.get(`a[id="userMenu_orgs_Test Organisation ${this.magicNumber}"]`).first().click();
      cy.wait(4000);

      // href should end with /edit
      cy.location("href").should("match", /\/edit$/);

      //* step 1: update form and click submit
      cy.get("input[name=name]").type(" updated", { moveToEnd: true });
      cy.get("textarea[name=streetAddress]").type(" updated", { moveToEnd: true });
      cy.get("input[name=province]").type(" updated", { moveToEnd: true });
      cy.get("input[name=city]").type(" updated", { moveToEnd: true });
      cy.get("select[name=countryId]").select(COUNTRY_ID2);
      cy.get("input[name=postalCode]").type("4321");
      cy.get("input[name=websiteURL]").type(".2", { moveToEnd: true });
      cy.get("input[name=tagline]").type(" updated", { moveToEnd: true });
      cy.get("textarea[name=biography]").type(" updated", { moveToEnd: true });
      cy.get("button.filepond--action-remove-item").click(); // remove existing image
      cy.fixture("org_logo.png").then((fileContent) => {
        cy.get("input[type=file][name=logo]").attachFile({
          fileContent: fileContent.toString(),
          fileName: "org_logo.png",
          mimeType: "image/png",
        });
      });

      cy.wait(500);
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(500);

      // assert toast message
      cy.get(".Toastify__toast-container").should("be.visible");
      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");

      //* step 2: update form and click submit
      cy.get("a[id=lnkOrganisationRoles]").click(); // click on the roles tab
      cy.wait(500);
      cy.get(`input[type=checkbox][name=providerTypes][value="${PROVIDER_TYPE_EDUCATION_ID}"]`).check(); //  check the "Education" checkbox
      cy.fixture("dummy.pdf").then((fileContent) => {
        cy.get("input[type=file][name=education]").attachFile({
          fileContent: fileContent.toString(),
          fileName: "dummy.pdf",
          mimeType: "application/pdf",
        });
      });
      cy.wait(500);
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(500);

      // assert toast message
      cy.get(".Toastify__toast-container").should("be.visible");
      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");

      //* step 3: click submit
      cy.get("a[id=lnkOrganisationAdmins]").click(); // click on the admins tab
      cy.wait(500);
      cy.get("button[type=submit]").should("exist").click();
      cy.wait(500);

      // assert toast message
      cy.get(".Toastify__toast-container").should("be.visible");
      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");
    });
  });

  describe(`${TESTADMINUSER_EMAIL} (Admin role)`, () => {
    beforeEach(() => {
      cy.login(TESTADMINUSER_EMAIL, TESTADMINUSER_PASSWORD);
    });

    it("should approve the organisation", function () {
      // visit the admin page
      cy.visit("http://localhost:3000/admin", {
        // stub the console log and error methods for console assertions
        onBeforeLoad(win) {
          cy.stub(win.console, "log").as("consoleLog");
          cy.stub(win.console, "error").as("consoleError");
        },
      });
      cy.wait(500);

      //* click on the admin link on the user menu
      cy.get(`button[id="btnUserMenu`).should("exist").click();
      cy.get(`a[id="userMenu_admin"]`).should("exist").click();
      cy.wait(1000);

      // href should end with /admin
      cy.location("href").should("match", /\/admin$/);

      //* click on the organisations link on the navigation menu
      cy.get(`button[id="btnNavbarMenu`).should("exist").click();
      cy.wait(200);
      cy.get(`a[id="lnkNavbarMenuModal_Organisations"]`).first().click();
      cy.wait(2000);

      // href should end with /organisations
      cy.location("href").should("match", /\/organisations$/);

      //* click on the organisation on the organisations page
      cy.get(`a[id="lnkOrganisation_Test Organisation ${this.magicNumber} updated"]`).should("exist").click();
      cy.wait(6000);

      // href should end with /verify
      cy.location("href").should("match", /\/verify$/);

      // open approve dialog
      cy.get(`button[id="btnApprove"]`).should("exist").click();

      // enter comments into textarea
      cy.get(`textarea[id="txtVerifyComments"]`).should("exist").type("Approved by admin user");

      // approve the organisation by clicking on approve button
      cy.get(`button[id="btnApproveModal"]`).should("exist").click();

      // assert toast message
      cy.get(".Toastify__toast-container").should("be.visible");
      // assert console with the expected message
      cy.get("@consoleLog").should("be.calledWith", "Organisation approved");

      // href should end with /organisations
      cy.location("href").should("match", /\/organisations$/);
    });
  });
});
