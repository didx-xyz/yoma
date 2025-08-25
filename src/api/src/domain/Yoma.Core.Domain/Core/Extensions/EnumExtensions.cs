using System.ComponentModel;
using System.Runtime.Serialization;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class EnumExtensions
  {
    public static string ToEnumMemberValue(this Enum value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      var type = value.GetType();

      var fieldInfo = (type?.GetField(value.ToString())) ?? throw new InvalidOperationException($"Failed to reflect the {nameof(value)} field info");
      var attrib = fieldInfo
          .GetCustomAttributes(false)
          .SingleOrDefault(attr => attr.GetType() == typeof(EnumMemberAttribute)) as EnumMemberAttribute;

      // return description
      return attrib?.Value ?? value.ToString();
    }

    public static string ToDescription(this Enum value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      var type = value.GetType();

      var fieldInfo = (type?.GetField(value.ToString())) ?? throw new InvalidOperationException($"Failed to reflect the {nameof(value)} field info");
      var attrib = fieldInfo
          .GetCustomAttributes(false)
          .SingleOrDefault(attr => attr.GetType() == typeof(DescriptionAttribute)) as DescriptionAttribute;

      return attrib?.Description ?? value.ToString();
    }

    public static string JoinNames<TEnum>(this TEnum[] values, string separator = "/")
        where TEnum : Enum
    {
      if (values?.Length is not > 0)
        throw new ArgumentException("Values array cannot be null or empty.", nameof(values));

      if (string.IsNullOrEmpty(separator))
        throw new ArgumentException("Separator cannot be null or empty", nameof(separator));

      return string.Join(separator, values.Select(v => v.ToDescription()));
    }
  }
}
