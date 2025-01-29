Vue.directive("otp-input", {
  bind(el, binding) {
    const { onSubmit } = binding.value;

    el.addEventListener("input", () => {
      el.value = el.value.replace(/[^0-9]/g, "");
      if (el.value.length === 6) {
        onSubmit(event);
      }
    });

    el.addEventListener("paste", (event) => {
      event.preventDefault();
      const pastedData = (event.clipboardData || window.clipboardData).getData("text");
      const digits = pastedData.replace(/\D/g, "").slice(0, 6);
      el.value = digits;
      if (digits.length === 6) {
        onSubmit(event);
      }
    });
  },
});
