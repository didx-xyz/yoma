import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: false, // otherwise final page load even never fires?
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
