Vue.directive("toggle-password", {
  bind(el, binding) {
    const { passwordSelector } = binding.value;

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
  },
});
