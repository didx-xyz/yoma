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

      var fieldInfo = type.GetField(value.ToString());
      if (fieldInfo == null && value.IsDefinedOrValidFlags())
      {
        // A valid flags combination has no single enum field. Resolve each named flag using
        // the same descriptions as individual values, without exposing raw numeric bits.
        return string.Join(", ", value.ToString().Split(',')
          .Select(name => ((Enum)Enum.Parse(type, name.Trim())).ToDescription()));
      }
      if (fieldInfo == null)
        throw new InvalidOperationException($"Failed to reflect the {nameof(value)} field info");
      var attrib = fieldInfo
          .GetCustomAttributes(false)
          .SingleOrDefault(attr => attr.GetType() == typeof(DescriptionAttribute)) as DescriptionAttribute;

      return attrib?.Description ?? value.ToString();
    }

    /// <summary>
    /// Accepts a declared enum value or a flags combination containing only declared values.
    /// Unknown numeric bits remain unsupported, including during historical credential rendering.
    /// </summary>
    public static bool IsDefinedOrValidFlags(this Enum value)
    {
      ArgumentNullException.ThrowIfNull(value);

      var type = value.GetType();
      if (Enum.IsDefined(type, value)) return true;

      return type.IsDefined(typeof(FlagsAttribute), false)
        && value.ToString().Split(',').All(name => Enum.IsDefined(type, name.Trim()));
    }

    /// <summary>
    /// Returns selected individual flags in enum order, excluding zero and composite aliases.
    /// Rejects unknown bits instead of silently dropping them from a credential or display.
    /// </summary>
    public static List<Enum> GetFlags(this Enum value)
    {
      ArgumentNullException.ThrowIfNull(value);
      var type = value.GetType();
      if (!type.IsDefined(typeof(FlagsAttribute), false))
        throw new ArgumentException("A flags enum is required", nameof(value));
      if (!value.IsDefinedOrValidFlags())
        throw new NotSupportedException($"Unsupported flags value '{value}' for enum '{type.Name}'");

      return [.. Enum.GetValues(type).Cast<Enum>()
        .Where(flag =>
        {
          var bits = Convert.ToDecimal(flag) < 0
            ? unchecked((ulong)Convert.ToInt64(flag))
            : Convert.ToUInt64(flag);

          return bits != 0 && (bits & (bits - 1)) == 0 && value.HasFlag(flag);
        })
        .Distinct()];
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
