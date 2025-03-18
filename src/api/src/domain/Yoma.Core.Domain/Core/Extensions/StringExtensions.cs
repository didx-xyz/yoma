using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static partial class StringExtensions
  {
    #region Public Members
    public static string SanitizeLogValue(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return input.Replace(System.Environment.NewLine, string.Empty);
    }

    /// <summary>
    ///  trim (remove leading/trailing spaces), remove double spaces
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static string NormalizeTrim(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var ret = input.Normalize().Trim();
      //set more than one space to one space
      ret = RegexDoubleSpacing().Replace(ret, " ");
      return ret;
    }

    /// <summary>
    /// Strip all masking characters & inner spaces, except '+', e.g: (###) ###-#### | +## (##) ###-####
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string NormalizeContact(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var rgx = RegexContactNumber();
      return rgx.Replace(input.Normalize().Trim(), "");
    }

    /// <summary>
    /// remove all space characters
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string RemoveWhiteSpaces(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return new string([.. input.ToCharArray().Where(c => !char.IsWhiteSpace(c))]);
    }

    /// <summary>
    /// Equals (invariant case & culture)
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static bool EqualsInvariantCultureIgnoreCase(this string input, string comparate)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      ArgumentNullException.ThrowIfNull(comparate, nameof(comparate));

      return string.Equals(input, comparate, StringComparison.InvariantCultureIgnoreCase);
    }

    /// <summary>
    /// Values that equals the default value of the type, must revert to NULL. Will apply NormalizeTrim to valid values.
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string? NormalizeNullableValue(this string input)
    {
      if (string.IsNullOrWhiteSpace(input)) return null;
      return string.IsNullOrEmpty(input) ? null : input.NormalizeTrim();
    }

    /// <summary>
    /// Converts string to TitleCase
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static string TitleCase(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(input.NormalizeTrim());
    }

    /// <summary>
    /// Converts string to Initials
    /// </summary>
    /// <returns></returns>
    public static string ToInitials(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var initialsRegEx = RegexInitials();
      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(
          initialsRegEx.Replace(input, "$1")
              .NormalizeTrim()
              .RemoveWhiteSpaces());
    }

    public static string RemoveSpecialCharacters(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      // normalize the string to remove diacritics (accents)
      string normalizedString = input.Normalize(NormalizationForm.FormD).Trim();
      var stringBuilder = new StringBuilder();

      foreach (var c in normalizedString)
      {
        // keep the character only if it is a letter or a digit
        if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
        {
          stringBuilder.Append(c);
        }
      }

      // further strip any non-ASCII characters (optional, depending on requirements)
      var asciiOnly = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

      // remove all non-alphanumeric characters
      var result = NonAplhaNumberic().Replace(asciiOnly, string.Empty);
      return result.Trim(); // remove leading and trailing spaces
    }

    public static string TrimToLength(this string input, int length)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      input = input.NormalizeTrim();

      if (length < 1)
        throw new ArgumentOutOfRangeException(nameof(length), "Must be at least 1 characters");

      return input.Length <= length ? input : input[..length];
    }

    public static string RemoveMarkdownAsterisks(this string input)
    {
      if (string.IsNullOrEmpty(input))
        throw new ArgumentNullException(nameof(input));

      // Replace all asterisks (*) used in Markdown formatting
      return MarkdownAsterisks().Replace(input, string.Empty);
    }

    #endregion

    #region Private Members
    [GeneratedRegex("[ ]{2,}", RegexOptions.None)]
    private static partial Regex RegexDoubleSpacing();

    [GeneratedRegex("[^a-zA-Z0-9]")]
    private static partial Regex RegexContactNumber();

    [GeneratedRegex("(\\b[a-zA-Z])[a-zA-Z]*\\.* ?")]
    private static partial Regex RegexInitials();

    [GeneratedRegex("[^a-zA-Z0-9 ]")] // include a space in the regex pattern
    private static partial Regex NonAplhaNumberic();

    [GeneratedRegex(@"\*")]
    private static partial Regex MarkdownAsterisks();
    #endregion
  }
}
