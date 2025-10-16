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
