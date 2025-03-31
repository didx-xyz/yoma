module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "fr", "pt", "sw"],
  },
  localePath: "./public/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
