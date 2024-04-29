function passwordIndicator(resourcesPath, emailSelector, password) {
  var email = document.querySelector(emailSelector).value;

  const requirements = {
    length: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    email: !password.includes(email),
  };

  const passwordRequirements = document.querySelector("#password-requirements");

  for (const requirement in requirements) {
    const element = passwordRequirements.querySelector(`#${requirement}`);
    let imgElement = element.querySelector("img");

    if (!imgElement) {
      imgElement = document.createElement("img");

      element.insertBefore(imgElement, element.firstChild);
    }

    if (requirements[requirement]) {
      imgElement.src = `${resourcesPath}/img/icon-check.png`;
    } else {
      imgElement.src = `${resourcesPath}/img/icon-cross.png`;
    }
  }

  passwordRequirements.style.display = "flex";
}
