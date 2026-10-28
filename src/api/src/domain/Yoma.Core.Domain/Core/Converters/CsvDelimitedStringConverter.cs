using CsvHelper;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.Core.Converters
{
  public class CsvDelimitedStringConverter : ICsvConverter<List<string>?>
  {
    #region Public Members
    public List<string>? Read(CsvReader reader, int index)
    {
      var text = reader.GetString(index);
      if (string.IsNullOrWhiteSpace(text)) return null;

      return [.. text.Split(CSVImportHelper.Value_Delimiter).Select(value => value.Trim())];
    }

    public void Write(CsvWriter writer, List<string>? value)
    {
      throw new NotSupportedException("Does not support converting from model to CSV");
    }
    #endregion
  }
}
