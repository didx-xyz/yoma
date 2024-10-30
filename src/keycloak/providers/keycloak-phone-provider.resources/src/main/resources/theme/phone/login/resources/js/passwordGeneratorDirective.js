Vue.directive("password-generator", {
  bind(el, binding) {
    const { passwordSelector, confirmPasswordSelector } = binding.value;

    const generateValidPassword = () => {
      const length = 10;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let password = "";
      while (!isValidPassword(password)) {
        password = "";
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
          const randomIndex = randomValues[i] % charset.length;
          password += charset[randomIndex];
        }
      }
      return password;
    };

    const isValidPassword = (password) => {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      return password.length >= 10 && hasUpperCase && hasLowerCase && hasNumber;
    };

    el.addEventListener("change", () => {
      if (el.checked) {
        const generatedPassword = generateValidPassword();
        const passwordInput = document.querySelector(passwordSelector);
        const confirmPasswordInput = document.querySelector(confirmPasswordSelector);

        if (passwordInput) {
          passwordInput.value = generatedPassword;
          passwordInput.dispatchEvent(new Event("input")); // Trigger input event for v-model binding
        }

        if (confirmPasswordInput) {
          confirmPasswordInput.value = generatedPassword;
          confirmPasswordInput.dispatchEvent(new Event("input")); // Trigger input event for v-model binding
        }
      }
    });
  },
});
