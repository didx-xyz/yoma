using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Yoma.Core.Domain.Core.Converters
{
  public class SingleOrArrayConverter<T> : JsonConverter
  {
    #region Public Properties
    public override bool CanRead => true;
    public override bool CanWrite => false;
    #endregion

    #region Public Members
    public override bool CanConvert(Type objectType)
    {
      return (objectType == typeof(List<T>));
    }

    public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
    {
      JToken token = JToken.Load(reader);
      if (token.Type == JTokenType.Array)
      {
        return token.ToObject<List<T>>();
      }

      var item = token.ToObject<T>();
      if (item == null) return null;

      return new List<T> { item };
    }

    public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
