using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Yoma.Core.Domain.Core.Converters
{
  public class StrictStringEnumConverter : StringEnumConverter
  {
    #region Public Members
    /// <summary>
    /// Reject undefined enum values (numeric or string). Default = true.
    /// </summary>
    public bool RejectUndefinedValues { get; init; } = true;

    public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
    {
      var isNullable = Nullable.GetUnderlyingType(objectType) != null;
      var enumType = Nullable.GetUnderlyingType(objectType) ?? objectType;

      if (!enumType.IsEnum)
        throw new JsonSerializationException($"StrictStringEnumConverter can only be used with enums. Type was {enumType}.");

      if (reader.TokenType == JsonToken.Null)
      {
        if (isNullable)
          return null;

        throw new JsonSerializationException($"A value is required for enum '{enumType.Name}'.");
      }

      // Handle integer tokens
      if (reader.TokenType == JsonToken.Integer)
      {
        if (!AllowIntegerValues)
          throw new JsonSerializationException($"Numeric value '{reader.Value}' is not allowed for enum '{enumType.Name}'. Send the name instead.");

        var raw = ToUInt64(reader.Value!);
        if (RejectUndefinedValues && !IsDefinedOrValidFlags(enumType, raw))
          throw new JsonSerializationException($"Value '{reader.Value}' is not valid for enum '{enumType.Name}'.");

        return Enum.ToObject(enumType, ConvertToUnderlying(reader.Value!, enumType));
      }

      // Let base converter parse string values
      var parsed = base.ReadJson(reader, objectType, existingValue, serializer);

      if (parsed is null)
        return null;

      if (RejectUndefinedValues && parsed is Enum e)
      {
        var u64 = ToUInt64(e);
        if (!IsDefinedOrValidFlags(enumType, u64))
          throw new JsonSerializationException($"Value '{e}' is not a defined member of '{enumType.Name}'.");
      }

      return parsed;
    }
    #endregion

    #region Private Members
    private static bool IsDefinedOrValidFlags(Type enumType, ulong value)
    {
      var isFlags = enumType.GetCustomAttributes(typeof(FlagsAttribute), false).Length != 0;
      if (!isFlags)
        return Enum.GetValues(enumType).Cast<object>().Any(v => ToUInt64(v) == value);

      ulong mask = 0;
      foreach (var v in Enum.GetValues(enumType))
        mask |= ToUInt64(v);
      return (value & ~mask) == 0;
    }

    private static ulong ToUInt64(object value)
    {
      if (value.GetType().IsEnum)
        value = Convert.ChangeType(value, Enum.GetUnderlyingType(value.GetType()));

      return value switch
      {
        sbyte sb => unchecked((ulong)sb),
        short s => unchecked((ulong)s),
        int i => unchecked((ulong)i),
        long l => unchecked((ulong)l),
        byte b => b,
        ushort us => us,
        uint ui => ui,
        ulong ul => ul,
        _ => Convert.ToUInt64(value)
      };
    }

    private static object ConvertToUnderlying(object raw, Type enumType)
    {
      var under = Enum.GetUnderlyingType(enumType);
      return Convert.ChangeType(raw, under);
    }
    #endregion
  }
}
