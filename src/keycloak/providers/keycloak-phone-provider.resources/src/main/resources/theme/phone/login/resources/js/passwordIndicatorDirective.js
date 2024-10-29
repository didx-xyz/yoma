Vue.directive("password-indicator", {
  inserted(el, binding) {
    const { resourcesPath, /*emailSelector,*/ passwordSelector, labels } = binding.value;

    function updatePasswordIndicator() {
      //const email = document.querySelector(emailSelector).value;
      const password = document.querySelector(passwordSelector).value;

      const requirements = {
        length: password.length >= 10,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        // email: !email || !password.includes(email),
      };

      const passwordRequirements = el;
      const requirementText = `
        Password should be a minimum of <span id="length">${labels.length}</span> and must include at least
        <span id="uppercase">${labels.uppercase}</span>, <span id="lowercase">${labels.lowercase}</span> and
        <span id="number">${labels.number}</span>.
      `;
      passwordRequirements.innerHTML = requirementText;

      let allRequirementsMet = true;

      for (const requirement in requirements) {
        const element = passwordRequirements.querySelector(`#${requirement}`);
        if (requirements[requirement]) {
          element.classList.add("requirement-success");
          element.classList.remove("requirement-fail");
        } else {
          element.classList.add("requirement-fail");
          element.classList.remove("requirement-success");
          allRequirementsMet = false;
        }
      }

      passwordRequirements.style.display = allRequirementsMet ? "none" : "block";
    }

    document.querySelector(passwordSelector).addEventListener("input", updatePasswordIndicator);
    // document.querySelector(emailSelector).addEventListener("input", updatePasswordIndicator);
  },
});
