// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "cypress-file-upload";

Cypress.Commands.add("login", (username, password) => {
  // cy.visit('/login') // replace with your login page URL
  // cy.get('input[name=username]').type(username) // replace with your username input field
  // cy.get('input[name=password]').type(password) // replace with your password input field
  // cy.get('button[type=submit]').click() // replace with your submit button
  // cy.wait(500) // adjust the wait time as needed

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
  cy.get("div.navbar-end button").click();
  cy.wait(1000);
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
});

Cypress.Commands.overwrite("log", (originalFn, message) => {
  const log = originalFn(message);
  log.snapshot("Log");
  log.end();
  return cy.wrap(message);
});
