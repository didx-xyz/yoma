using Newtonsoft.Json;

namespace Yoma.Core.Domain.SSI.Models.Lookups
{
  public class SSISchemaEntityProperty
  {
    public Guid Id { get; set; }

    [JsonIgnore]
    public string Name { get; set; } = null!;

    public string NameDisplay { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string AttributeName { get; set; } = null!;

    public string TypeName { get; set; } = null!;

    /// <summary>
    /// Developer-controlled presentation group for non-system credential attributes.
    /// This metadata is not part of the signed credential schema and is read-only to schema administrators.
    /// Null leaves the property ungrouped and activates the display-label fallback.
    /// </summary>
    public string? Group { get; set; }

    /// <summary>
    /// Optional developer-controlled presentation subgroup for non-system credential attributes.
    /// </summary>
    public string? SubGroup { get; set; }

    /// <summary>
    /// Developer-controlled order within the presentation group and subgroup.
    /// System properties render in the fixed credential header and therefore do not use this value.
    /// Null falls back to the display label.
    /// </summary>
    public int? SortOrder { get; set; }

    [JsonIgnore]
    public string? DotNetType { get; set; }

    public bool System { get; set; }

    [JsonIgnore]
    public SchemaEntityPropertySystemType? SystemType { get; set; }

    [JsonIgnore]
    public string? Format { get; set; }

    public bool Required { get; set; }
  }
}
