import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Module resolution for the unit tests (`pnpm test`): Node runs the TypeScript itself (type
 * stripping, plus `--experimental-transform-types` for the enums), and this hook adds what the
 * bundler gives the app — the `~/` alias and extensionless or directory (`/index`) imports.
 * Registered by `./register.mjs`. Bare package specifiers resolve as Node does.
 */

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

/** @param {string} target */
const isFile = (target) => existsSync(target) && statSync(target).isFile();

/** @type {import("node:module").ResolveHook} */
export async function resolve(specifier, context, nextResolve) {
  /** @type {string | null} */
  let target = null;
  if (specifier.startsWith("~/")) target = path.join(SRC, specifier.slice(2));
  else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  )
    target = path.resolve(
      path.dirname(fileURLToPath(context.parentURL)),
      specifier,
    );

  const hit = target
    ? SUFFIXES.map((suffix) => target + suffix).find(isFile)
    : undefined;
  return hit
    ? nextResolve(pathToFileURL(hit).href, context)
    : nextResolve(specifier, context);
}
