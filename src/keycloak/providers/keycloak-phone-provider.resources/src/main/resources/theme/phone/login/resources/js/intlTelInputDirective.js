Vue.directive("intl-tel-input", {
  inserted(el) {
    intlTelInput(el, {
      loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.10.6/build/js/utils.js"),
      //onlyCountries: ["za"], // only South Africa for now
      initialCountry: "auto",
      useFullscreenPopup: false,
      geoIpLookup: (callback) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => callback(data.country_code))
          .catch(() => callback("za"));
      },
    });
  },
});
