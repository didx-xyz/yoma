
using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldFilter
  {
    public string Key { get; set; } = null!;

    public CustomFieldFilterOperator Operator { get; set; }

    public string? Value { get; set; }

    public List<string>? Values { get; set; }

    /// <summary>
    /// Hydrated from the matching custom field definition before repository filtering; not supplied by API callers.
    /// </summary>
    [JsonIgnore]
    public CustomFieldDataType? DataType { get; set; }
  }
}
