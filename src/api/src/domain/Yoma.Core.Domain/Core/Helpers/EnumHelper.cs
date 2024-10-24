using System.ComponentModel;
using System.Reflection;
using System.Runtime.Serialization;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class EnumHelper
  {
    public static T? GetValueFromEnumMemberValue<T>(string value) where T : struct, Enum
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(value, nameof(value));
      value = value.Trim();

      var type = typeof(T);
      foreach (var name in Enum.GetNames(type))
      {
        var attr = type.GetRuntimeField(name)?.GetCustomAttribute<EnumMemberAttribute>(true);
        if (attr != null && string.Equals(attr.Value, value, StringComparison.InvariantCultureIgnoreCase))
          return (T)Enum.Parse(type, name, true);
      }

      return null;
    }

    public static T? GetValueFromDescription<T>(string value) where T : struct, Enum
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(value, nameof(value));
      value = value.Trim();

      var type = typeof(T);
      foreach (var field in type.GetFields())
      {
        var attribute = field.GetCustomAttribute<DescriptionAttribute>();
        var attrDescription = attribute?.Description;

        if (!string.IsNullOrEmpty(attrDescription) &&
            string.Equals(attrDescription, value, StringComparison.InvariantCultureIgnoreCase))
        {
          return (T)Enum.Parse(type, field.Name);
        }
      }

      return null;
    }
  }
}
