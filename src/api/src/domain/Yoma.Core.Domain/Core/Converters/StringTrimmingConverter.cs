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

    public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
    {
      if (reader.TokenType == JsonToken.Null) return null;

      if (reader.TokenType != JsonToken.String || reader.Value is not string value)
        throw new JsonSerializationException(
          $"Expected a string value but received token '{reader.TokenType}'.");

      var result = value.Trim();

      return string.IsNullOrEmpty(result) ? null : result;
    }

    public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
