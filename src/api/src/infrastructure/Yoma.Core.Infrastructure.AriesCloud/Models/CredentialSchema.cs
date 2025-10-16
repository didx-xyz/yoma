using Yoma.Core.Domain.SSI;

namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
  public class CredentialSchema
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Version { get; set; } = null!;

    public string AttributeNames { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
