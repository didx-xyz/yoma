using Newtonsoft.Json;
using System.Globalization;

namespace Yoma.Core.Domain.Core.Converters
{
  /// <summary>
  /// Converts incoming date/time JSON values to UTC DateTimeOffset values.
  ///
  /// Some partner APIs return date values without an explicit timezone offset.
  /// These values are treated as UTC to avoid local-machine offsets being applied during
  /// deserialization, which PostgreSQL timestamp with time zone columns reject when the
  /// value is not UTC.
  /// </summary>
  public sealed class UtcDateTimeOffsetConverter : JsonConverter<DateTimeOffset?>
  {
    private static readonly string[] Formats =
    [
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-ddTHH:mm:ss",
      "yyyy-MM-ddTHH:mm:ss'Z'",
      "yyyy-MM-ddTHH:mm:sszzz",
      "yyyy-MM-ddTHH:mm:ss.FFFFFFF'Z'",
      "yyyy-MM-ddTHH:mm:ss.FFFFFFFzzz"
    ];

    public override DateTimeOffset? ReadJson(JsonReader reader, Type objectType, DateTimeOffset? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
      if (reader.TokenType == JsonToken.Null)
        return null;

      if (reader.Value is DateTimeOffset dateTimeOffsetValue)
        return dateTimeOffsetValue.ToUniversalTime();

      if (reader.Value is DateTime dateTimeValue)
        return dateTimeValue.Kind == DateTimeKind.Unspecified
          ? new DateTimeOffset(dateTimeValue, TimeSpan.Zero)
          : new DateTimeOffset(dateTimeValue).ToUniversalTime();

      var value = reader.Value?.ToString()?.Trim();

      if (string.IsNullOrWhiteSpace(value))
        return null;

      if (DateTime.TryParseExact(value, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateTimeWithoutOffset))
        return new DateTimeOffset(dateTimeWithoutOffset, TimeSpan.Zero);

      if (DateTimeOffset.TryParseExact(value, Formats, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateTimeOffsetExact))
        return dateTimeOffsetExact.ToUniversalTime();

      if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dateTimeOffset))
        return dateTimeOffset.ToUniversalTime();

      throw new JsonSerializationException($"Unable to parse date value '{value}'");
    }

    public override void WriteJson(JsonWriter writer, DateTimeOffset? value, JsonSerializer serializer)
    {
      if (!value.HasValue)
      {
        writer.WriteNull();
        return;
      }

      writer.WriteValue(value.Value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
    }
  }
}
