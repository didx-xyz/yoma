import { register } from "node:module";

// `node --import ./test/register.mjs` — see `./hooks.mjs`.
register("./hooks.mjs", import.meta.url);
