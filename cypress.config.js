const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false, // Fixes endless loading
  video: true, // always screen record
  hosts: {
    keycloak: "127.0.0.1",
  },
  e2e: {
    specPattern: "**/*.cy.{js,ts}",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
