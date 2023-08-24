describe("Login to Partner Portal", () => {
  it("should login to partner portal", () => {
    cy.visit("http://localhost:3001");
    cy.reload(); // Reload the page to get cookies to load
    cy.getAllCookies().then((cookies) => {
      cookies.forEach((c) => {
        cy.log(c);
      });
    });
    cy.get("div.navbar-end button").click();
    cy.origin("http://keycloak:8080", () => {
      cy.reload(); // Reload the page to get cookies to load
      cy.getAllCookies().then((cookies) => {
        cookies.forEach((c) => {
          cy.log(c);
        });
      });
      cy.get("#username").type("testorgadminuser@gmail.com");
      cy.get("#password").type("P@ssword1");
      cy.get("#kc-login").click();
    });
    cy.get(".button").click();
    cy.location("href").should("eq", "http://localhost:3001/");
  });
});
