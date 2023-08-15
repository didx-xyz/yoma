using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Converters
{
  public class StringTrimmingConverter : JsonConverter
  {
    #region Public Properties
    public override bool CanRead => true;
    public override bool CanWrite => false;
    #endregion

    #region Public Members
    public override bool CanConvert(Type objectType) => objectType == typeof(string);

    public override object? ReadJson(JsonReader reader, Type objectType,
                                    object? existingValue, JsonSerializer serializer)
    {
      if (reader.Value == null) return null;
      return ((string) reader.Value).Trim();
    }

    public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
