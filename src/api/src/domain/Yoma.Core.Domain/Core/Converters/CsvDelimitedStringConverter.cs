using CsvHelper.TypeConversion;
using System.Reflection;

namespace Yoma.Core.Domain.Core.Converters
{
  public class CsvDelimitedStringConverter : DefaultTypeConverter
  {
    #region Public Members
    public override object? ConvertFromString(string? text, CsvHelper.IReaderRow row, CsvHelper.Configuration.MemberMapData memberMapData)
    {
      var propertyInfo = memberMapData.Member as PropertyInfo
       ?? throw new InvalidOperationException("Could not retrieve property information");

      if (propertyInfo.PropertyType != typeof(List<string>))
        throw new InvalidOperationException($"The property '{propertyInfo.Name}' must be of type List<string>?");

      if (string.IsNullOrWhiteSpace(text)) return null;

      return text.Split('|').Select(value => value.Trim()).ToList();
    }

    public override string? ConvertToString(object? value, CsvHelper.IWriterRow row, CsvHelper.Configuration.MemberMapData memberMapData)
    {
      throw new NotImplementedException("Does not support converting from model to CSV");
    }
    #endregion
  }
}
