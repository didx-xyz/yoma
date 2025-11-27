using FluentValidation;
using FluentValidation.Validators;
using Yoma.Core.Domain.Core.Extensions;
namespace Yoma.Core.Domain.Core.Helpers
{
  public static class RedactorHelper
  {
    public static string RedactUsername(string username)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(username, nameof(username));
      username = username.Trim();

      if (username.Contains('@')) return MaskEmail(username);

      if (PhoneNumberValidator.IsValidPhoneNumber(username)) return MaskPhone(username);

      // Fallback: generic username masking (should never happen)
      if (username.Length <= 2) return new string('*', username.Length);

      return $"{username[0]}{new string('*', username.Length - 2)}{username[^1]}";
    }

    public static string RedactDisplayName(string displayName)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(displayName, nameof(displayName));
      displayName = displayName.NormalizeTrim();

      if (displayName.Contains('@')) return MaskEmail(displayName);

      if (PhoneNumberValidator.IsValidPhoneNumber(displayName)) return MaskPhone(displayName);

      var parts = displayName.Split(' ', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

      if (parts.Length == 1) return parts[0].TitleCase();

      return $"{parts[0].TitleCase()} {char.ToUpper(parts[^1][0])}.";
    }

    public static string MaskEmail(string email)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(email, nameof(email));
      email = email.Trim();

      var validator = new InlineValidator<string>();
      validator.RuleFor(x => x).EmailAddress(EmailValidationMode.AspNetCoreCompatible);
      validator.ValidateAndThrow(email);

      var parts = email.Split('@');

      var user = parts[0];
      var domain = parts[1];

      if (user.Length <= 2) return $"***@{domain}";

      return $"{user[0]}***{user[^1]}@{domain}";
    }

    public static string MaskPhone(string phoneNumber)
    {
      var phoneNumberNormalized = phoneNumber.NormalizePhoneNumber(true);

      ArgumentException.ThrowIfNullOrWhiteSpace(phoneNumberNormalized, nameof(phoneNumber));

      if (!PhoneNumberValidator.IsValidPhoneNumber(phoneNumberNormalized)) throw new ArgumentException("Phone number invalid", nameof(phoneNumber));

      var digits = phoneNumberNormalized.Where(char.IsDigit).ToArray();

      if (digits.Length <= 4) return "****";

      var result = $"****{new string(digits[^4..])}";

      if (!phoneNumberNormalized.StartsWith('+')) return result;

      return $"+{result}";
    }
  }
}
