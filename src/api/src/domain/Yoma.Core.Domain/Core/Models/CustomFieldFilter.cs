
using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Models
{
  public sealed class CustomFieldFilter
  {
    public string Key { get; set; } = null!;

    public CustomFieldFilterOperator? Operator { get; set; }

    public UnspecifiedMatch? Unspecified { get; set; }

    public string? Value { get; set; }

    /// <summary>
    /// Inclusive upper bound used only by the Between operator.
    /// </summary>
    public string? ValueTo { get; set; }

    public List<string>? Values { get; set; }

    /// <summary>
    /// Hydrated from the matching active definition before repository filtering; not supplied by API callers.
    /// </summary>
    [JsonIgnore]
    public Guid? CustomFieldDefinitionId { get; set; }

    /// <summary>
    /// Hydrated from the matching custom field definition before repository filtering; not supplied by API callers.
    /// </summary>
    [JsonIgnore]
    public CustomFieldDataType? DataType { get; set; }

    [JsonIgnore]
    public string? EntityContext { get; set; }

    /// <summary>
    /// Resolved Opportunity context ID. Non-applicable types pass a scoped clause;
    /// they are not classified as missing values for that definition.
    /// </summary>
    [JsonIgnore]
    public Guid? AppliesToTypeId { get; set; }
  }
}
