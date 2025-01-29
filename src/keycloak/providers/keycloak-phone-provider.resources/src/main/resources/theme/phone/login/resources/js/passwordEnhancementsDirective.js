Vue.directive("password-enhancements", {
  inserted(el, binding) {
    const {
      allowToggle,
      allowCopy,
      allowPasswordIndicator,
      allowGenerate,
      messages,
      confirmPasswordInputSelector,
      confirmPasswordContainerSelector,
      createPasswordCheckboxSelector,
      passwordServerErrorLabelSelector,
      confirmPasswordServerErrorLabelSelector,
      copyPasswordButtonStyle = "block",
      onValidityChange,
    } = binding.value;

    const passwordInput = el;
    const confirmPasswordInput = document.querySelector(confirmPasswordInputSelector);
    const confirmPasswordContainer = document.querySelector(confirmPasswordContainerSelector);
    const createPasswordCheckbox = document.querySelector(createPasswordCheckboxSelector);
    const passwordServerErrorLabel = document.querySelector(passwordServerErrorLabelSelector);
    const confirmPasswordServerErrorLabel = document.querySelector(confirmPasswordServerErrorLabelSelector);

    const passwordMessageLabel = document.createElement("span");
    passwordMessageLabel.id = "password-message-label";
    passwordMessageLabel.setAttribute("aria-live", "polite");
    passwordInput.parentNode.insertBefore(passwordMessageLabel, passwordInput.nextSibling);

    const confirmMessageLabel = document.createElement("span");
    confirmMessageLabel.id = "confirm-password-message-label";
    confirmMessageLabel.setAttribute("aria-live", "polite");

    if (confirmPasswordInput) {
      confirmPasswordInput.parentNode.insertBefore(confirmMessageLabel, confirmPasswordInput.nextSibling);
    }

    let passwordValid = false;
    let confirmPasswordValid = !confirmPasswordInput;

    function createInlineCopyButton() {
      const copyIcon = document.createElement("i");
      copyIcon.className = "fa fa-copy";
      copyIcon.style.position = "absolute";
      copyIcon.style.top = "15px";
      copyIcon.style.right = "10px";
      copyIcon.style.cursor = "pointer";
      copyIcon.style.fontSize = "20px";
      copyIcon.style.display = "none";

      copyIcon.addEventListener("click", async () => {
        if (passwordInput.value) {
          await copyTextToClipboard(passwordInput.value);
        }
      });

      passwordInput.parentNode.insertBefore(copyIcon, passwordInput);
      passwordInput.style.paddingRight = "40px";
      return copyIcon;
    }

    function createBlockCopyButton() {
      const button = document.createElement("button");
      button.textContent = messages.copyButtonText;
      button.type = "button";
      button.className = "pf-c-button pf-m-primary pf-m-block btn-lg";
      button.style.display = "none";

      button.addEventListener("click", async (e) => {
        e.preventDefault();
        if (passwordInput.value) {
          await copyTextToClipboard(passwordInput.value);
        }
      });

      return button;
    }

    function isValidPassword(password) {
      if (!password || password.trim() === "") {
        return false;
      }

      const requirements = {
        length: password.length >= 10,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
      };
      return Object.values(requirements).every(Boolean);
    }

    function emitValidityChange() {
      if (typeof onValidityChange === "function") {
        onValidityChange(passwordValid, confirmPasswordValid);
      }
    }

    function validateConfirmPassword() {
      if (!confirmPasswordInput) {
        confirmPasswordValid = true;
        emitValidityChange();
        return;
      }

      const password = passwordInput.value;
      const confirmValue = confirmPasswordInput.value;

      confirmPasswordValid = confirmValue !== "" && confirmValue === password;

      updateConfirmPasswordStyles(messages);
      emitValidityChange();
    }

    async function copyTextToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.cssText = `
          position: fixed;
          opacity: 0;
          top: 0;
          left: 0;
          width: 1px;
          height: 1px;
          padding: 0;
          border: none;
          outline: none;
          boxShadow: none;
          background: transparent;
        `;

        try {
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const successful = document.execCommand("copy");

          if (!successful) {
            throw new Error("Copy command failed");
          }
        } catch (err) {
          console.error("Failed to copy:", err);
          passwordMessageLabel.style.display = "block";
          passwordMessageLabel.style.color = "red";
          passwordMessageLabel.textContent = messages.passwordCopyFailed;
          return;
        } finally {
          document.body.removeChild(textarea);
        }
      }

      passwordMessageLabel.style.display = "block";
      passwordMessageLabel.style.color = "green";
      passwordMessageLabel.textContent = "✔ " + messages.passwordCopySuccess;
    }

    function updatePasswordStyles() {
      if (passwordServerErrorLabel) {
        // Hide server message when validation messages are shown
        if (passwordInput.value) {
          passwordServerErrorLabel.style.display = "none";
        }
      }

      if (passwordValid) {
        passwordInput.removeAttribute("aria-invalid");
        passwordMessageLabel.style.display = "none";
      } else {
        passwordInput.setAttribute("aria-invalid", "true");
        // Only show validation messages if user has started typing
        if (passwordInput.value) {
          passwordMessageLabel.style.display = "block";
        }
      }
    }

    function updateConfirmPasswordStyles(messages) {
      if (!confirmPasswordInput) {
        return;
      }

      if (confirmPasswordValid) {
        confirmPasswordInput.removeAttribute("aria-invalid");
        confirmMessageLabel.textContent = "";
        confirmMessageLabel.style.display = "none";
      } else {
        confirmPasswordInput.setAttribute("aria-invalid", "true");
        if (confirmPasswordInput.value) {
          // Only show message if user has started typing
          confirmMessageLabel.style.display = "block";
          confirmMessageLabel.style.color = "red";
          confirmMessageLabel.textContent = messages.passwordMismatchMessage;
        } else {
          confirmMessageLabel.style.display = "none";
          confirmMessageLabel.textContent = "";
        }
      }
    }

    function updateValidationDisplay(messages) {
      updatePasswordStyles();
      updateConfirmPasswordStyles(messages);
    }

    function updatePasswordIndicator() {
      if (createPasswordCheckbox && createPasswordCheckbox.checked) {
        passwordValid = true;
        confirmPasswordValid = true;
        emitValidityChange();
        return;
      }

      const password = passwordInput.value;
      const requirements = {
        length: password.length >= 10,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
      };

      // if (password === "") {
      //   passwordMessageLabel.innerHTML = "";
      //   passwordMessageLabel.style.display = "none";
      //   passwordValid = false;
      //   emitValidityChange();
      //   return;
      // }

      passwordValid = Object.values(requirements).every(Boolean);

      if (passwordValid) {
        passwordMessageLabel.style.display = "none";
      } else {
        const requirementText = messages.passwordRequirements.instructions
          .replace("{0}", `<span id="length">${messages.passwordRequirements.length}</span>`)
          .replace("{1}", `<span id="uppercase">${messages.passwordRequirements.uppercase}</span>`)
          .replace("{2}", `<span id="lowercase">${messages.passwordRequirements.lowercase}</span>`)
          .replace("{3}", `<span id="number">${messages.passwordRequirements.number}</span>`);

        passwordMessageLabel.innerHTML = requirementText;
        passwordMessageLabel.style.color = "rgb(73, 80, 87)";

        for (const requirement in requirements) {
          const element = passwordMessageLabel.querySelector(`#${requirement}`);
          if (element) {
            element.style.textDecoration = "underline";
            element.style.color = requirements[requirement] ? "green" : "red";
          }
        }
        passwordMessageLabel.style.display = "block";
      }

      validateConfirmPassword();
    }

    Vue.nextTick(() => {
      let copyButton;

      if (allowCopy) {
        if (copyPasswordButtonStyle === "inline") {
          copyButton = createInlineCopyButton();

          const toggleCopyIconVisibility = () => {
            copyButton.style.display = passwordInput.value ? "block" : "none";
          };

          passwordInput.addEventListener("input", toggleCopyIconVisibility);

          const observer = new MutationObserver(toggleCopyIconVisibility);
          observer.observe(passwordInput, {
            attributes: true,
            childList: true,
            subtree: true,
          });
        } else {
          copyButton = createBlockCopyButton();

          if (confirmPasswordContainer && confirmPasswordContainer.parentNode) {
            confirmPasswordContainer.parentNode.insertBefore(copyButton, confirmPasswordContainer.nextSibling);
          }
        }
      }

      if (allowToggle) {
        const toggleIcon = document.createElement("i");
        toggleIcon.className = "fa fa-eye";
        toggleIcon.style.position = "absolute";
        toggleIcon.style.top = "15px";
        toggleIcon.style.left = "10px";
        toggleIcon.style.cursor = "pointer";
        toggleIcon.style.fontSize = "20px";
        toggleIcon.addEventListener("click", () => {
          passwordInput.type = passwordInput.type === "password" ? "text" : "password";
        });
        passwordInput.parentNode.insertBefore(toggleIcon, passwordInput);
        passwordInput.style.paddingLeft = "40px";

        const typeObserver = new MutationObserver(() => {
          toggleIcon.className = passwordInput.type === "password" ? "fa fa-eye" : "fa fa-eye-slash";
        });

        typeObserver.observe(passwordInput, {
          attributes: true,
          attributeFilter: ["type"],
        });

        const form = passwordInput.closest("form");
        if (form) {
          form.addEventListener(
            "submit",
            () => {
              if (passwordInput.type === "text") {
                passwordInput.type = "password";
              }
            },
            true
          );
        }
      }

      const generateValidPassword = () => {
        const length = 10;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        // Helper function to get cryptographically secure random integer
        const getSecureRandomInt = (max) => {
          const array = new Uint32Array(1);
          const maxUint = Math.pow(2, 32);
          do {
            window.crypto.getRandomValues(array);
          } while (array[0] >= maxUint - (maxUint % max)); // Eliminate modulo bias
          return array[0] % max;
        };

        let password = "";
        while (!isValidPassword(password)) {
          password = "";
          for (let i = 0; i < length; i++) {
            const randomIndex = getSecureRandomInt(charset.length);
            password += charset[randomIndex];
          }
        }
        return password;
      };

      const handleGeneratedPassword = (generated, password) => {
        if (passwordServerErrorLabel) passwordServerErrorLabel.style.display = "none";

        if (generated) {
          passwordInput.value = password;
          passwordInput.type = "text";
          passwordInput.setAttribute("readonly", true);
          if (confirmPasswordInput) {
            confirmPasswordInput.value = password;
            confirmPasswordInput.setAttribute("readonly", true);
          }
          if (confirmPasswordContainer) {
            confirmPasswordContainer.style.display = "none";
          }
          passwordMessageLabel.style.display = "block";
          passwordMessageLabel.style.color = "green";
          passwordMessageLabel.textContent = messages.passwordCreated;
          if (copyButton) {
            copyButton.style.display = "block";
          }
          passwordValid = true;
          confirmPasswordValid = true;
        } else {
          passwordInput.value = "";
          passwordInput.type = "password";
          passwordInput.removeAttribute("readonly");
          if (confirmPasswordInput) {
            confirmPasswordInput.value = "";
            confirmPasswordInput.removeAttribute("readonly");
          }
          if (confirmPasswordContainer) {
            confirmPasswordContainer.style.display = "block";
          }

          passwordMessageLabel.style.display = "none";
          passwordMessageLabel.textContent = "";

          if (copyButton) {
            copyButton.style.display = "none";
          }
          passwordValid = false;
          confirmPasswordValid = false;
        }
        passwordInput.removeAttribute("aria-invalid");
        if (confirmPasswordInput) confirmPasswordInput.removeAttribute("aria-invalid");

        emitValidityChange();
      };

      if (allowGenerate && createPasswordCheckbox) {
        createPasswordCheckbox.addEventListener("change", () => {
          const generated = createPasswordCheckbox.checked;
          const password = generated ? generateValidPassword() : "";
          handleGeneratedPassword(generated, password);
        });
      }

      if (allowPasswordIndicator) {
        if (confirmPasswordInput) {
          confirmPasswordInput.addEventListener("input", () => {
            // Hide server message as soon as user starts typing
            if (confirmPasswordServerErrorLabel) {
              confirmPasswordServerErrorLabel.style.display = "none";
            }

            validateConfirmPassword();
            updateValidationDisplay(messages);
          });
        } else {
          confirmPasswordValid = true;
        }

        passwordInput.addEventListener("input", () => {
          // Hide server message as soon as user starts typing
          if (passwordServerErrorLabel) {
            passwordServerErrorLabel.style.display = "none";
          }

          passwordValid = isValidPassword(passwordInput.value);
          updatePasswordIndicator();
          updateValidationDisplay();
          emitValidityChange();
        });

        passwordInput.addEventListener("blur", () => {
          updateValidationDisplay(messages);
        });

        const form = passwordInput.closest("form");
        if (form) {
          form.addEventListener(
            "submit",
            (e) => {
              passwordValid = isValidPassword(passwordInput.value);
              validateConfirmPassword();
              updateValidationDisplay(messages);

              if (!passwordValid || !confirmPasswordValid) {
                e.preventDefault();
                if (!passwordValid) {
                  if (passwordServerErrorLabel) {
                    // Hide server message when validation messages are shown
                    passwordServerErrorLabel.style.display = "none";
                  }

                  // passwordMessageLabel.style.display = "block";
                  // passwordMessageLabel.style.color = "red";
                  // passwordMessageLabel.textContent = messages.passwordInvalidMessage;

                  // show the password requirements
                  updatePasswordIndicator();
                }
                if (!confirmPasswordValid && confirmPasswordInput) {
                  // Hide server message when validation messages are shown
                  if (confirmPasswordServerErrorLabel) {
                    confirmPasswordServerErrorLabel.style.display = "none";
                  }

                  // show the mismatch message
                  confirmMessageLabel.style.display = "block";
                  confirmMessageLabel.style.color = "red";
                  confirmMessageLabel.textContent = messages.passwordMismatchMessage;
                }
              }
            },
            true
          );
        }
      }
    });
  },
});
