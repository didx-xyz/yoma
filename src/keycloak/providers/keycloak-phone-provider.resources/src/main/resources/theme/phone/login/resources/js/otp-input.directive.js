Vue.directive("otp-input", {
  bind(el) {
    const inputs = el.querySelectorAll('input[type="text"]');
    const hiddenInput = el.querySelector('input[type="hidden"], input#code');
    let isFocusing = false;

    const updateHiddenInput = () => {
      const value = Array.from(inputs)
        .map((input) => input.value || " ")
        .join("");
      hiddenInput.value = value.trim();
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData("text");
      const sanitizedValue = pastedText.replace(/[^0-9]/g, "");

      const chars = sanitizedValue.split("");
      inputs.forEach((input, index) => {
        input.value = chars[index] || "";
      });

      const focusIndex = Math.min(inputs.length - 1, chars.length - 1);
      if (focusIndex >= 0) {
        inputs[focusIndex].focus();
        inputs[focusIndex].select();
      }

      updateHiddenInput();
    };

    const handleInput = (input, index) => {
      if (isFocusing) return;

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
        const sanitizedValue = input.value.replace(/[^0-9]/g, "");
        const chars = sanitizedValue.split("");
        inputs.forEach((input, idx) => {
          input.value = chars[idx - index] || input.value;
        });

        isFocusing = true;
        const focusIndex = Math.min(inputs.length - 1, index + chars.length - 1);
        inputs[focusIndex].focus();
        inputs[focusIndex].select();
        setTimeout(() => {
          isFocusing = false;
        }, 0);
      }

      updateHiddenInput();
    };

    const handleKeydown = (e, input, index) => {
      switch (e.keyCode) {
        case 37: // Left arrow
          if (index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].select();
          }
          e.preventDefault();
          break;
        case 39: // Right arrow
          if (index + 1 < inputs.length) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
          }
          e.preventDefault();
          break;
        case 8: // Backspace
          if (input.value === "" && index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].select();
            inputs[index - 1].value = "";
            updateHiddenInput();
            e.preventDefault();
          }
          break;
        case 46: // Delete
          if (index < inputs.length - 1) {
            for (let i = index; i < inputs.length - 1; i++) {
              inputs[i].value = inputs[i + 1].value;
            }
            inputs[inputs.length - 1].value = "";
            updateHiddenInput();
            e.preventDefault();
          }
          break;
      }
    };

    inputs.forEach((input, index) => {
      input.setAttribute("maxlength", "1");
      input.setAttribute("pattern", "[0-9]*");
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("autocomplete", "off");
      input.classList.add("otp-input");

      input.addEventListener("focus", () => input.select());
      input.addEventListener("input", () => handleInput(input, index));
      input.addEventListener("keydown", (e) => handleKeydown(e, input, index));
    });

    // Handle paste event on the first input
    inputs[0].addEventListener("paste", handlePaste);

    // Listen for changes in the hidden input (auto-fill from SMS)
    hiddenInput.addEventListener("input", function (e) {
      const code = e.target.value.replace(/[^0-9]/g, "");
      const digits = code.split("");

      inputs.forEach((input, index) => {
        input.value = digits[index] || "";
      });

      updateHiddenInput();
    });
  },
});
