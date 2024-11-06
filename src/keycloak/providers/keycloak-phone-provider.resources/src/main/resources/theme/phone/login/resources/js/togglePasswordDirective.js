Vue.directive("toggle-password", {
  bind(el, binding) {
    const { passwordSelector, formSelector } = binding.value;

    el.addEventListener("click", () => {
      const password = document.querySelector(passwordSelector);

      if (password.type === "password") {
        password.type = "text";
        el.className = "fa fa-eye";
      } else {
        password.type = "password";
        el.className = "fa fa-eye-slash";
      }
    });

    // const form = document.querySelector(formSelector);
    // if (form) {
    //   console.log("xxx Form found:", formSelector);
    //   debugger;
    //   form.addEventListener("submit", (event) => {
    //     debugger;
    //     console.log("xxx Form submit event triggered");
    //     const password = document.querySelector(passwordSelector);
    //     if (password.type === "text") {
    //       password.type = "password";
    //       console.log("xxx *** password is text! ***");
    //     } else {
    //       console.log("xxx *** password is password! ***");
    //     }
    //   });
    // } else {
    //   console.log("xxx Form not found:", formSelector);
    // }
  },
});
