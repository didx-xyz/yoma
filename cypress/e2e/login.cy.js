describe("Login to Yoma Web Youth", () => {
  it("should login to yoma web youth", () => {
    cy.visit("http://localhost:3000");
    cy.reload(); // Reload the page to get cookies to load
    cy.getAllCookies().then((cookies) => {
      cookies.forEach((c) => {
        cy.log(c);
      });
    });
    cy.get("div.navbar-end button").click();
    cy.wait(500);
    cy.origin("http://keycloak:8080", () => {
      cy.reload(); // Reload the page to get cookies to load
      cy.getAllCookies().then((cookies) => {
        cookies.forEach((c) => {
          cy.log(c);
        });
      });
      cy.wait(500);
      cy.get("#username").type("testuser@gmail.com");
      cy.get("#password").type("P@ssword1");
      cy.get("#kc-login").click();
    });
    cy.get(".button").click();
    cy.location("href").should("eq", "http://localhost:3000/");
  });
});
