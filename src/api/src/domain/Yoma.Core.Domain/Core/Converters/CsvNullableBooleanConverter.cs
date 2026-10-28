using CsvHelper;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.Core.Converters
{
  /// <summary>
  /// Keeps a blank optional boolean unanswered; supplied values use the same
  /// compatibility rules as required boolean columns.
  /// </summary>
  public class CsvNullableBooleanConverter : ICsvConverter<bool?>
  {
    #region Class Variables
    private static readonly CsvBooleanConverter _converter = new();
    #endregion

    #region Public Members
    public bool? Read(CsvReader reader, int index)
    {
      return string.IsNullOrEmpty(reader.GetString(index)) ? null : _converter.Read(reader, index);
    }

    public void Write(CsvWriter writer, bool? value)
    {
      writer.WriteField(value.HasValue
        ? value.Value ? CSVImportHelper.Boolean_Value_True : CSVImportHelper.Boolean_Value_False
        : null);
    }
    #endregion
  }
}
