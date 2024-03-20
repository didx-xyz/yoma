using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Yoma.Core.Domain.Core.Converters
{
  public class IgnoreEmptyJsonObjectConverter<T> : JsonConverter<T?> where T : class
  {
    public override T? ReadJson(JsonReader reader, Type objectType, T? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
      if (reader.TokenType == JsonToken.String)
      {
        // Handle string input, assuming it represents an empty object
        var jsonString = reader.Value?.ToString();
        if (string.IsNullOrWhiteSpace(jsonString) || jsonString == "{}")
        {
          return null;
        }
      }

      // Proceed with the regular logic for other token types
      var jObject = JObject.Load(reader);

      if (jObject.HasValues)
      {
        return jObject.ToObject<T>(serializer);
      }
      else
      {
        return null;
      }
    }

    public override void WriteJson(JsonWriter writer, T? value, JsonSerializer serializer)
    {
      serializer.Serialize(writer, value);
    }
  }
}
