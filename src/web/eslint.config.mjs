import { defineConfig, globalIgnores } from "eslint/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixupConfigRules } from "@eslint/compat";
import nextConfig from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read gitignore and convert to ignore patterns
const gitignorePath = path.join(__dirname, "../../.gitignore");
const gitignoreContent = fs.existsSync(gitignorePath)
  ? fs
      .readFileSync(gitignorePath, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
  : [];

export default defineConfig([
  // Apply global ignores from .gitignore
  globalIgnores(["public/**/*", "node_modules/**", ...gitignoreContent]),
  ...fixupConfigRules(nextConfig),
  ...fixupConfigRules(nextTypescript),
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",

      parserOptions: {
        project: true,
      },
    },

    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "prefer-spread": "off",
      "prefer-const": "off",
      // React Compiler rules (react-hooks v5) — project does not use React Compiler
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
    },
  },
]);
