const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};
const validatePhoneNumber = (phoneNumber: string) => {
  const re = /^\+?\d+$/;
  return re.test(phoneNumber);
};
export { validateEmail,validatePhoneNumber };
