import { defineConfig, globalIgnores } from "eslint/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

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

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  // Apply global ignores from .gitignore
  globalIgnores(["public/**/*", "node_modules/**", ...gitignoreContent]),
  {
    extends: compat.extends(
      "next",
      "next/core-web-vitals",
      "next/typescript",
      "prettier",
    ),

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
    },
  },
]);
