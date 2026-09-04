using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Models
{
  public class SSISchema
  {
    public string Id { get; set; } = null!;

    /// <summary>
    /// Full schema name, including the schema type and optional type context.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Friendly schema name supplied by the administrator, excluding the schema type and optional type context.
    /// </summary>
    public string DisplayName { get; set; } = null!;

    public Guid TypeId { get; set; }

    public SchemaType Type { get; set; }

    public string TypeDescription { get; set; } = null!;

    /// <summary>
    /// Optional context that scopes the schema within its type; i.e. for opportunity schemas this is the opportunity type
    /// </summary>
    public string? TypeContext { get; set; }

    public Version Version { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public string ArtifactTypeDescription => ArtifactType.ToDescription();

    public List<SSISchemaEntity> Entities { get; set; } = null!;

    public int? PropertyCount { get; set; }
  }
}
