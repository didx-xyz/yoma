using PhoneNumbers;
using System.Text;
using System.Text.RegularExpressions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static partial class PhoneNumberExtensions
  {
    #region Class Variables
    private static readonly PhoneNumberUtil _phoneUtil = PhoneNumberUtil.GetInstance();
    #endregion

    #region Public Members

    /// <summary>
    /// Normalizes a contact number by:
    /// 1. Converting vanity letters to digits (e.g. 1-800-FLOWERS → 18003569377)
    /// 2. Stripping all non-digit characters except '+'
    /// 3. Removing any whitespace
    /// 4. Formatting to E.164 (e.g. +27831234567)
    /// </summary>
    public static string? NormalizePhoneNumber(this string? input, bool returnOriginalOnFormatFailure)
    {
      input = input?.Trim();
      if (string.IsNullOrEmpty(input)) return null;

      try
      {
        var vanityConverted = ConvertVanityToDigits(input);
        var stripped = RegexContactNumber().Replace(vanityConverted, string.Empty);
        var cleaned = stripped.RemoveWhiteSpaces();

        var number = _phoneUtil.Parse(cleaned, null);
        return _phoneUtil.Format(number, PhoneNumberFormat.E164);
      }
      catch (NumberParseException)
      {
        return returnOriginalOnFormatFailure ? input : null;
      }
    }

    /// <summary>
    /// Gets the alpha-2 region code (e.g. ZA, US) from a valid phone number.
    /// Assumes input is already normalized.
    /// </summary>
    public static string ToPhoneNumberCountryCodeAlpha2(this string input)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(input, nameof(input));

      var number = _phoneUtil.Parse(input, null);
      return _phoneUtil.GetRegionCodeForNumber(number);
    }

    /// <summary>
    /// Gets the country calling code (e.g. +27, +44) from a valid phone number.
    /// Assumes input is already normalized.
    /// </summary>
    public static string ToPhoneNumberCountryCodeCalling(this string input)
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(input, nameof(input));

      var number = _phoneUtil.Parse(input, null);
      return $"+{number.CountryCode}";
    }

    #endregion

    #region Private Members

    /// <summary>
    /// Converts vanity letters in a phone number (e.g. FLOWERS) to numeric digits.
    /// Keeps digits and the '+' symbol. Other characters are ignored.
    /// </summary>
    private static string ConvertVanityToDigits(string input)
    {
      var sb = new StringBuilder();

      foreach (char c in input.ToUpperInvariant())
      {
        if (char.IsDigit(c) || c == '+')
        {
          sb.Append(c);
        }
        else if (c is >= 'A' and <= 'Z')
        {
          sb.Append(MapLetterToDialPadDigit(c));
        }
      }

      return sb.ToString();
    }

    /// <summary>
    /// Maps a letter A-Z to the corresponding dial pad digit.
    /// </summary>
    private static char MapLetterToDialPadDigit(char c) => c switch
    {
      >= 'A' and <= 'C' => '2',
      >= 'D' and <= 'F' => '3',
      >= 'G' and <= 'I' => '4',
      >= 'J' and <= 'L' => '5',
      >= 'M' and <= 'O' => '6',
      >= 'P' and <= 'S' => '7',
      >= 'T' and <= 'V' => '8',
      >= 'W' and <= 'Z' => '9',
      _ => c
    };

    [GeneratedRegex("[^0-9+]")]
    private static partial Regex RegexContactNumber();

    #endregion
  }
}
