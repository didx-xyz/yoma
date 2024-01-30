declare global {
  namespace Cypress {
    interface Chainable {
      login: typeof login;
    }
  }
}

export const login = (username: string, password: string) => {
  // avoid "State cookie was missing" error
  cy.intercept("/api/auth/**", (req) =>
    req.on("response", (res) => {
      const setCookies = res.headers["set-cookie"];
      res.headers["set-cookie"] = (Array.isArray(setCookies) ? setCookies : [setCookies])
        .filter((x) => x?.startsWith("next-auth"))
        .map((headerContent) => {
          const replaced = headerContent.replace(/samesite=(lax|strict)/gi, "secure; samesite=none");
          console.log("replaced", headerContent, "with", replaced);
          return replaced;
        });
    })
  );

  cy.visit("http://localhost:3000");
  cy.reload(); // Reload the page to get cookies to load
  // cy.getAllCookies().then((cookies) => {
  //   cookies.forEach((c) => {
  //     cy.log(c);
  //   });
  // });
  cy.get('button[id="btnSignIn"]').should("exist").click();
  cy.wait(2000);
  cy.origin("http://keycloak:8080", { args: { username, password } }, ({ username, password }) => {
    cy.reload(); // Reload the page to get cookies to load
    // cy.getAllCookies().then((cookies) => {
    //   cookies.forEach((c) => {
    //     cy.log(c);
    //   });
    // });
    cy.wait(500);
    cy.get("#username").type(username);
    cy.get("#password").type(password);
    cy.get("#kc-login").click();
  });
  //cy.wait(5000);
  //cy.get(".button").click();
  cy.location("href").should("eq", "http://localhost:3000/");
};
