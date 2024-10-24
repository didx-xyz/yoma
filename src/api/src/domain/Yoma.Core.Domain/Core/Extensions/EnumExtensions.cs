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
  }
}
