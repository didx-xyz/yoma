describe("Test User", () => {
  beforeEach(() => {
    cy.login("testuser@gmail.com", "P@ssword1");
  });

  it("should register and edit an organisation", function () {
    cy.visit("http://localhost:3000/organisations/register"); // visit the registration page
    cy.wait(500);

    const randomNum = Math.floor(Math.random() * 1000000);
    this.organisationName = `Test Organisation ${randomNum}`;

    //* step 1: fill out form and click next
    cy.get("input[name=name]").type(this.organisationName);
    cy.get("textarea[name=streetAddress]").type("123 Fake Street");
    cy.get("input[name=province]").type("Bogusville");
    cy.get("input[name=city]").type("Fake City");
    cy.get("select[name=countryId]").select("a0d029b2-49ca-4e89-81aa-8d06be5d2241");
    cy.get("input[name=postalCode]").type("1234");
    cy.get("input[name=websiteURL]").type("http://www.google.com");
    cy.get("input[name=tagline]").type("Lorem ipsum dolor sit amet, consectetuer adipiscing elit.");
    cy.get("textarea[name=biography]").type(
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa."
    );

    cy.fixture("org_logo.png").then((fileContent) => {
      cy.get("input[type=file][name=logo]").attachFile({
        fileContent: fileContent.toString(),
        fileName: "org_logo.png",
        mimeType: "image/png",
      });
    });

    cy.wait(500);
    // Assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(500);

    //* step 2: fill out form and click next
    cy.get('input[type=checkbox][name=providerTypes][value="6fb02f6f-34fe-4e6e-9094-2e3b54115235"]').check(); //  check the "Impact" checkbox

    cy.fixture("dummy.pdf").then((fileContent) => {
      cy.get("input[type=file][name=registration]").attachFile({
        fileContent: fileContent.toString(),
        fileName: "dummy.pdf",
        mimeType: "application/pdf",
      });
    });

    cy.wait(500);
    // Assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(500);

    //* step 3: click submit
    // Assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(5000);

    //* success page
    cy.location("href").should("eq", "http://localhost:3000/organisations/register/success");
    //});

    // it("should edit an organisation", function () {
    cy.visit("http://localhost:3000/"); // visit the home page

    cy.wait(500);

    cy.get(`button[id="btnUserMenu`).first().click();

    //* click on the organisation on the user menu
    cy.get(`a[id="userMenu_orgs_${this.organisationName}"]`).first().click();

    cy.wait(500);

    // href should end with /edit
    cy.location("href").should("match", /\/edit$/);

    // stub console.log to confirm that the organisation has been updated
    cy.window().then((win) => {
      cy.stub(win.console, "log").as("consoleLog");
    });

    //* step 1: update form and click submit
    cy.get("input[name=name]").type(" updated", { moveToEnd: true });
    cy.get("textarea[name=streetAddress]").type(" updated", { moveToEnd: true });
    cy.get("input[name=province]").type(" updated", { moveToEnd: true });
    cy.get("input[name=city]").type(" updated", { moveToEnd: true });
    cy.get("select[name=countryId]").select("fb8c57b0-255a-4528-ae87-4b324f47a4d5");
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
    // Assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(500);

    // assert toast message
    cy.get(".Toastify__toast-container").should("be.visible");
    // assert console with the expected message
    cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");
    // assert that the organisation admins tab is not active before clicking it
    //cy.get("a[id=lnkOrganisationRoles]").should("not.have.class", "active").click();

    //* step 2: update form and click submit
    cy.get("a[id=lnkOrganisationRoles]").click(); // click on the roles tab
    cy.wait(500);
    cy.get('input[type=checkbox][name=providerTypes][value="a3bcaa03-b31c-4830-aae8-06bba701d3f0"]').check(); //  check the "Education" checkbox

    cy.fixture("dummy.pdf").then((fileContent) => {
      cy.get("input[type=file][name=education]").attachFile({
        fileContent: fileContent.toString(),
        fileName: "dummy.pdf",
        mimeType: "application/pdf",
      });
    });

    cy.wait(500);
    // assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(500);

    // assert toast message
    cy.get(".Toastify__toast-container").should("be.visible");
    // assert console with the expected message
    cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");

    //* step 3: click submit
    cy.get("a[id=lnkOrganisationAdmins]").click(); // click on the admins tab
    cy.wait(500);

    // assert that the submit button exists before clicking it
    cy.get("button[type=submit]").should("exist").click();
    cy.wait(500);

    // assert toast message
    cy.get(".Toastify__toast-container").should("be.visible");
    // assert console with the expected message
    cy.get("@consoleLog").should("be.calledWith", "Your organisation has been updated");
  });
});
