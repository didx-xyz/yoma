import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
} from "libphonenumber-js";

const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

interface PhoneValidationResult {
  isValid: boolean;
  normalizedNumber: string | null;
}

interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string | null;
}

/**
 * Normalizes and validates a phone number
 * 1. Stripping all non-digit characters except '+'
 * 2. Removing any whitespace
 * 3. Formatting to E.164 (e.g. +27831234567)
 */
const normalizeAndValidatePhoneNumber = (
  input: string,
): PhoneValidationResult => {
  if (!input || input.trim() === "") {
    return { isValid: false, normalizedNumber: null };
  }

  // Strip all non-digit characters except '+'
  const stripNonDigits = (str: string): string => {
    return str.replace(/[^0-9+]/g, "");
  };

  try {
    const stripped = stripNonDigits(input);

    // Use parsePhoneNumber to validate and format
    const phoneNumber = parsePhoneNumberFromString(stripped);
    const isValid = isValidPhoneNumber(stripped);

    if (phoneNumber && isValid) {
      return {
        isValid: true,
        normalizedNumber: phoneNumber.format("E.164"),
      };
    }

    return {
      isValid: false,
      normalizedNumber: null,
    };
  } catch {
    // Return original on format failure if needed
    return {
      isValid: false,
      normalizedNumber: null,
    };
  }
};

/**
 * Normalizes and validates an email address
 * 1. Converts to lowercase
 * 2. Removes all whitespace characters
 * 3. Validates the format
 */
const normalizeAndValidateEmail = (input: string): EmailValidationResult => {
  if (!input || input.trim() === "") {
    return { isValid: false, normalizedEmail: null };
  }

  // Normalize the email by removing all whitespace and converting to lowercase
  const normalizedEmail = input.replace(/\s/g, "").toLowerCase();

  // Validate the normalized email
  const isValid = validateEmail(normalizedEmail);

  return {
    isValid,
    normalizedEmail: isValid ? normalizedEmail : null,
  };
};

// Simple function for compatibility with existing code
const validatePhoneNumber = (phoneNumber: string): boolean => {
  return normalizeAndValidatePhoneNumber(phoneNumber).isValid;
};

export {
  validateEmail,
  validatePhoneNumber,
  normalizeAndValidatePhoneNumber,
  normalizeAndValidateEmail,
};
