const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false, // Fixes endless loading
  video: true, // always screen record
  hosts: {
    keycloak: "127.0.0.1",
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
