using System.Globalization;
using System.Text.RegularExpressions;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class StringExtensions
  {
    /// <summary>
    ///  trim (remove leading/trailing spaces), remove double spaces
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string NormalizeTrim(this string e)
    {
      var ret = e.Normalize().Trim();
      //set more than one space to one space
      var regex = new Regex("[ ]{2,}", RegexOptions.None);
      ret = regex.Replace(ret, " ");
      return ret;
    }

    /// <summary>
    /// Strip all masking characters & inner spaces, except '+', e.g: (###) ###-#### | +## (##) ###-####
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string NormalizeContact(this string e)
    {
      var rgx = new Regex("[^a-zA-Z0-9]");
      return rgx.Replace(e.Normalize().Trim(), "");
    }

    /// <summary>
    /// remove all space characters
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string RemoveWhiteSpaces(this string e)
    {
      return new string(e.ToCharArray()
          .Where(c => !Char.IsWhiteSpace(c))
          .ToArray());
    }

    /// <summary>
    /// Equals (invariant case & culture)
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static bool EqualsInvariantCultureIgnoreCase(this string e, string comparate)
    {
      return string.Equals(e, comparate, StringComparison.InvariantCultureIgnoreCase);
    }

    /// <summary>
    /// Values that equals the default value of the type, must revert to NULL. Will apply NormalizeTrim to valid values.
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string? NormalizeNullableValue(this string e)
    {
      if (string.IsNullOrWhiteSpace(e)) return null;
      return string.IsNullOrEmpty(e) ? null : e.NormalizeTrim();
    }

    /// <summary>
    /// Converts string to PascalCase (TitleCase)
    /// </summary>
    /// <param name="e"></param>
    /// <returns></returns>
    public static string PascalCase(this string e)
    {
      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(e.NormalizeTrim());
    }

    /// <summary>
    /// Converts string to Initials
    /// </summary>
    /// <returns></returns>
    public static string ToInitials(this string e)
    {
      var initialsRegEx = new Regex(@"(\b[a-zA-Z])[a-zA-Z]*\.* ?");
      return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(
          initialsRegEx.Replace(e, "$1")
              .NormalizeTrim()
              .RemoveWhiteSpaces());
    }
  }
}
