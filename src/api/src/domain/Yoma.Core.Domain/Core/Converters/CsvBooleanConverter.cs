using CsvHelper;
using System.Globalization;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.Core.Converters
{
  /// <summary>
  /// Preserves the import template's Yes/No, True/False and numeric 0/1 values.
  /// CsvHelper 34's additional shorthand values are deliberately not enabled.
  /// </summary>
  public class CsvBooleanConverter : ICsvConverter<bool>
  {
    #region Public Members
    public bool Read(CsvReader reader, int index)
    {
      var text = reader.GetString(index);
      if (bool.TryParse(text, out var value)) return value;
      if (short.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number)
        && number is 0 or 1) return number == 1;
      if (string.Equals(text, CSVImportHelper.Boolean_Value_True, StringComparison.InvariantCultureIgnoreCase)) return true;
      if (string.Equals(text, CSVImportHelper.Boolean_Value_False, StringComparison.InvariantCultureIgnoreCase)) return false;

      throw new FormatException("Invalid boolean value");
    }

    public void Write(CsvWriter writer, bool value)
    {
      writer.WriteField(value ? CSVImportHelper.Boolean_Value_True : CSVImportHelper.Boolean_Value_False);
    }
    #endregion
  }
}
