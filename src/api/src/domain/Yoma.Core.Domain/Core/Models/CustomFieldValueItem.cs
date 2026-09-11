using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Models
{
  /// <summary>
  /// Outgoing custom field value payload for an entity. Definitions remain available via the custom field definition endpoints.
  /// </summary>
  public sealed class CustomFieldValueItem
  {
    /// <summary>
    /// Stable custom field definition key used to match this value to its definition.
    /// </summary>
    public string Key { get; set; } = null!;

    /// <summary>
    /// Internal data type used to shape scalar and option values for response serialization.
    /// </summary>
    [JsonIgnore]
    public CustomFieldDataType DataType { get; set; }

    /// <summary>
    /// Internal raw stored value.
    /// </summary>
    [JsonIgnore]
    public string? ValueRaw { get; set; }

    /// <summary>
    /// Scalar value for non-option fields.
    /// </summary>
    public string? Value => DataType == CustomFieldDataType.Option ? null : ValueRaw;

    /// <summary>
    /// Option key values for option fields. Single-select and multi-select options are both returned as a list.
    /// </summary>
    public List<string>? Values => DataType != CustomFieldDataType.Option || string.IsNullOrWhiteSpace(ValueRaw)
      ? null
      : [.. ValueRaw.Split(CustomFieldValue.Value_Delimiter, StringSplitOptions.RemoveEmptyEntries).Select(o => o.Trim())];
  }
}
