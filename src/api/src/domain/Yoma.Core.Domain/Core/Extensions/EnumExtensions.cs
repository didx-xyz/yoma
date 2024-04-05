using System.ComponentModel;
using System.Reflection;
using System.Runtime.Serialization;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class EnumExtensions
  {
    public static string ToEnumMemberValue(this Enum value)
    {
      ArgumentNullException.ThrowIfNull(value);

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
      ArgumentNullException.ThrowIfNull(value);

      var type = value.GetType();

      var fieldInfo = (type?.GetField(value.ToString())) ?? throw new InvalidOperationException($"Failed to reflect the {nameof(value)} field info");
      var attrib = fieldInfo
          .GetCustomAttributes(false)
          .SingleOrDefault(attr => attr.GetType() == typeof(DescriptionAttribute)) as DescriptionAttribute;

      return attrib?.Description ?? value.ToString();
    }

    public static string? GetValueFromEnumMemberValue<T>(string value)
        where T : Enum
    {
      var type = typeof(T);
      if (type.GetTypeInfo().IsEnum)
      {
        foreach (var name in Enum.GetNames(type))
        {
          var attr = type.GetRuntimeField(name)?.GetCustomAttribute<EnumMemberAttribute>(true);
          if (attr != null && attr.Value == value)
            return Enum.Parse(type, name, true).ToString();
        }

        return null;
      }

      throw new InvalidOperationException("Not Enum");
    }
  }
}
