using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static partial class StringExtensions
  {
    #region Public Members

    /// <summary>
    /// Removes line breaks from a string so it is safe to log on a single line.
    /// </summary>
    /// <param name="input">The string to sanitize.</param>
    /// <returns>The sanitized string.</returns>
    public static string SanitizeLogValue(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return input.Replace(System.Environment.NewLine, string.Empty);
    }

    /// <summary>
    /// Normalizes a string, trims leading and trailing whitespace, and replaces
    /// multiple consecutive spaces with a single space.
    /// </summary>
    /// <param name="input">The string to normalize.</param>
    /// <returns>The normalized string.</returns>
    public static string NormalizeTrim(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var result = input.Normalize().Trim();
      return RegexDoubleSpacing().Replace(result, " ");
    }

    /// <summary>
    /// Removes all whitespace characters from a string.
    /// </summary>
    /// <param name="input">The string to process.</param>
    /// <returns>The string without whitespace characters.</returns>
    public static string RemoveWhiteSpaces(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return new string([.. input.Where(c => !char.IsWhiteSpace(c))]);
    }

    /// <summary>
    /// Compares two strings for equality ignoring case using ordinal comparison.
    /// Intended for identifiers, usernames, codes, and other system values.
    /// </summary>
    /// <param name="input">The source string.</param>
    /// <param name="compareTo">The string to compare with.</param>
    /// <returns>True if the strings are equal ignoring case; otherwise false.</returns>
    public static bool EqualsOrdinalIgnoreCase(this string input, string compareTo)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));
      ArgumentNullException.ThrowIfNull(compareTo, nameof(compareTo));

      return string.Equals(input, compareTo, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Returns null for null, empty, or whitespace input; otherwise returns the
    /// normalized and trimmed string value.
    /// </summary>
    /// <param name="input">The string to normalize.</param>
    /// <returns>A normalized string, or null if no meaningful value exists.</returns>
    public static string? NormalizeNullableValue(this string input)
    {
      return string.IsNullOrWhiteSpace(input) ? null : input.NormalizeTrim();
    }

    /// <summary>
    /// Converts a string to title case after normalizing and trimming it.
    /// </summary>
    /// <param name="input">The string to convert.</param>
    /// <returns>The title-cased string.</returns>
    public static string TitleCase(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(input.NormalizeTrim());
    }

    /// <summary>
    /// Converts a string to initials.
    /// </summary>
    /// <param name="input">The string to convert.</param>
    /// <returns>The initials derived from the string.</returns>
    public static string ToInitials(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(
        RegexInitials()
          .Replace(input, "$1")
          .NormalizeTrim()
          .RemoveWhiteSpaces());
    }

    /// <summary>
    /// Removes diacritics and all non-alphanumeric characters from a string.
    /// </summary>
    /// <param name="input">The string to process.</param>
    /// <returns>The cleaned string.</returns>
    public static string RemoveSpecialCharacters(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      var normalized = input.Normalize(NormalizationForm.FormD).Trim();
      var builder = new StringBuilder();

      foreach (var character in normalized)
      {
        if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
          builder.Append(character);
      }

      var result = builder.ToString().Normalize(NormalizationForm.FormC);
      return NonAlphaNumeric().Replace(result, string.Empty).Trim();
    }

    /// <summary>
    /// Normalizes and trims a string, then truncates it to the specified maximum length.
    /// </summary>
    /// <param name="input">The string to process.</param>
    /// <param name="length">The maximum allowed length.</param>
    /// <returns>The truncated string if necessary; otherwise the original normalized string.</returns>
    public static string TrimToLength(this string input, int length)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      if (length < 1)
        throw new ArgumentOutOfRangeException(nameof(length), "Must be at least 1 character.");

      input = input.NormalizeTrim();

      return input.Length <= length ? input : input[..length];
    }

    /// <summary>
    /// Removes markdown asterisk characters from a string.
    /// </summary>
    /// <param name="input">The string to process.</param>
    /// <returns>The string without markdown asterisks.</returns>
    public static string RemoveMarkdownAsterisks(this string input)
    {
      ArgumentNullException.ThrowIfNull(input, nameof(input));

      return MarkdownAsterisks().Replace(input, string.Empty);
    }

    #endregion

    #region Private Members

    [GeneratedRegex("[ ]{2,}", RegexOptions.None)]
    private static partial Regex RegexDoubleSpacing();

    [GeneratedRegex("(\\b[a-zA-Z])[a-zA-Z]*\\.* ?")]
    private static partial Regex RegexInitials();

    [GeneratedRegex("[^a-zA-Z0-9 ]")]
    private static partial Regex NonAlphaNumeric();

    [GeneratedRegex(@"\*")]
    private static partial Regex MarkdownAsterisks();

    #endregion
  }
}
