using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Models
{
  public class SSISchema
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public Guid TypeId { get; set; }

    public SchemaType Type { get; set; }

    public string TypeDescription { get; set; } = null!;

    public Version Version { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public string ArtifactTypeDescription => ArtifactType.ToDescription();

    public List<SSISchemaEntity> Entities { get; set; } = null!;

    public int? PropertyCount { get; set; }
  }
}
