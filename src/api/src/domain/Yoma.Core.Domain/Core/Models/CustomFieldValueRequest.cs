namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldValueRequest
  {
    public string Key { get; set; } = null!;

    /// <summary>
    /// Scalar value for non-option fields. Must be null for option fields.
    /// </summary>
    public string? Value { get; set; }

    /// <summary>
    /// Selected option keys or lookup IDs for option fields. Single-select options require exactly one item;
    /// multi-select options require one or more items. Must be null for non-option fields.
    /// </summary>
    public List<string>? Values { get; set; }
  }
}
