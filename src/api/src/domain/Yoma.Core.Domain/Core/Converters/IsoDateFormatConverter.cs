using Newtonsoft.Json.Converters;

namespace Yoma.Core.Domain.Core.Converters
{
  public class IsoDateFormatConverter : IsoDateTimeConverter
  {
    public IsoDateFormatConverter(string dateTimeFormat)
    {
      DateTimeFormat = dateTimeFormat;
    }
  }
}
