import "cypress-file-upload";
import { login } from "./commands/login";
import { log } from "./commands/log";

Cypress.Commands.add("login", login);
Cypress.Commands.overwrite("log", log);
