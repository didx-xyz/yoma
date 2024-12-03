Vue.directive("otp-input", {
  bind(el, binding) {
    const inputs = el.querySelectorAll('input[type="text"]');
    const hiddenInput = el.querySelector('input[type="hidden"]');
    let isFocusing = false;

    const updateHiddenInput = () => {
      const value = Array.from(inputs)
        .map((input) => input.value || " ")
        .join("");
      hiddenInput.value = value;
    };

    const handlePaste = (e, index) => {
      // Only handle paste for first input
      if (index === 0) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData("text");
        const sanitizedValue = pastedText.replace(/[^0-9]/g, "");

        // Distribute digits across inputs
        const chars = sanitizedValue.split("");
        chars.forEach((char, pos) => {
          if (pos >= inputs.length) return;
          inputs[pos].value = char;
        });

        // Focus last filled input or last input
        const focusIndex = Math.min(inputs.length - 1, chars.length - 1);
        if (focusIndex >= 0) {
          inputs[focusIndex].focus();
          inputs[focusIndex].select();
        }

        updateHiddenInput();
      }
    };

    const handleInput = (input, index) => {
      if (isFocusing) return;

      // Ensure only digits
      input.value = input.value.replace(/[^0-9]/g, "");

      if (input.value.length === 1 && index + 1 < inputs.length) {
        isFocusing = true;
        inputs[index + 1].focus();
        inputs[index + 1].select();
        setTimeout(() => {
          isFocusing = false;
        }, 0);
      }

      if (input.value.length > 1) {
        // Sanitize pasted input to digits only
        const sanitizedValue = input.value.replace(/[^0-9]/g, "");

        if (!sanitizedValue) {
          input.value = "";
          return;
        }

        const chars = sanitizedValue.split("");
        chars.forEach((char, pos) => {
          if (pos + index >= inputs.length) return;
          inputs[pos + index].value = char;
        });

        isFocusing = true;
        const focusIndex = Math.min(inputs.length - 1, index + chars.length);
        inputs[focusIndex].focus();
        inputs[focusIndex].select();
        setTimeout(() => {
          isFocusing = false;
        }, 0);
      }

      updateHiddenInput();
    };

    const handleKeydown = (e, input, index) => {
      // Left arrow
      if (e.keyCode === 37 && index > 0) {
        e.preventDefault();
        inputs[index - 1].focus();
        inputs[index - 1].select();
      }

      // Right arrow
      if (e.keyCode === 39 && index + 1 < inputs.length) {
        e.preventDefault();
        inputs[index + 1].focus();
        inputs[index + 1].select();
      }

      // Backspace
      if (e.keyCode === 8 && input.value === "" && index !== 0) {
        for (let i = index; i < inputs.length - 1; i++) {
          inputs[i].value = inputs[i + 1].value;
        }
        inputs[inputs.length - 1].value = "";
        inputs[index - 1].focus();
        inputs[index - 1].select();
        updateHiddenInput();
      }

      // Delete
      if (e.keyCode === 46 && index !== inputs.length - 1) {
        for (let i = index; i < inputs.length - 1; i++) {
          inputs[i].value = inputs[i + 1].value;
        }
        inputs[inputs.length - 1].value = "";
        input.focus();
        input.select();
        e.preventDefault();
        updateHiddenInput();
      }
    };

    inputs.forEach((input, index) => {
      // Set input attributes for better mobile experience
      input.setAttribute("maxlength", "1");
      input.setAttribute("pattern", "[0-9]*");
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("autocomplete", "off");
      input.classList.add("otp-input");

      // Add focus event to select text
      input.addEventListener("focus", () => input.select());
      input.addEventListener("input", () => handleInput(input, index));
      input.addEventListener("keydown", (e) => handleKeydown(e, input, index));
      input.addEventListener("paste", (e) => handlePaste(e, index)); // Add paste handler
    });
  },
});

Vue.directive("otp-input", {
  inserted(el) {
    const inputs = el.querySelectorAll('#otp-input input[type="text"]');
    const hiddenInput = el.querySelector("input#code");

    // Listen for changes in the hidden input (auto-fill from SMS)
    hiddenInput.addEventListener("input", function (e) {
      const code = e.target.value;
      const digits = code.split("");
      inputs.forEach((input, index) => {
        input.value = digits[index] || "";
      });
    });

    // Listen for manual input in individual inputs
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        // Move to the next input if a digit is entered
        if (input.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        // Update the hidden input value
        hiddenInput.value = Array.from(inputs)
          .map((i) => i.value)
          .join("");
      });

      // Handle backspace to move to the previous input
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  },
});
