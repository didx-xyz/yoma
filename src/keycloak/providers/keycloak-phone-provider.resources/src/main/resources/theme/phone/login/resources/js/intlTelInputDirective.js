// intl-tel-input v29 (bundled with its libphonenumber utils, see intlTelInputWithUtils.min.js).
// Options below pin the v25 behaviour the templates were written against; v26-v29 changed the
// defaults (separate dial code, strict mode, international display, fixed-line accepted).
Vue.directive("intl-tel-input", {
  inserted(el) {
    intlTelInput(el, {
      //onlyCountries: ["za"], // only South Africa for now
      initialCountryLookup: async () => {
        try {
          const res = await fetch("https://ipapi.co/json");
          const data = await res.json();
          return data.country_code;
        } catch {
          return "za";
        }
      },
      countrySelectorMode: "DROPDOWN",
      numberDisplayFormat: "NATIONAL",
      separateDialCode: false,
      strictMode: false,
      // OTPs go to mobiles only; v26+ also accepts FIXED_LINE by default
      allowedNumberTypes: ["MOBILE"],
    });
  },
});
