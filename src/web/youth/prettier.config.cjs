// https://prettier.io/docs/en/configuration.html#basic-configuration
/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  trailingComma: "all",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  endOfLine: "lf",
  printWidth: 80,
};

module.exports = config;
