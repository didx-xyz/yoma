using PhoneNumbers;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class PhoneNumberValidator
  {
    #region Calss Variables
    private static readonly PhoneNumberUtil _phoneUtil = PhoneNumberUtil.GetInstance();
    #endregion

    #region Public Members
    /// <summary>
    /// Checks if the given normalized phone number is valid.
    /// Input must not be null or empty and should be in E.164 format (e.g., +27831234567).
    /// Must already be normalized. Trailing/leading spaces will cause failure.
    /// </summary>
    public static bool IsValidPhoneNumber(string? input)
    {
      input = input?.Trim();
      if (string.IsNullOrEmpty(input)) return false;

      try
      {
        // Use "ZZ" to force international context and prevent changes
        var number = _phoneUtil.Parse(input, null);
        return _phoneUtil.IsValidNumber(number);
      }
      catch (NumberParseException)
      {
        return false;
      }
    }
    #endregion
  }
}
