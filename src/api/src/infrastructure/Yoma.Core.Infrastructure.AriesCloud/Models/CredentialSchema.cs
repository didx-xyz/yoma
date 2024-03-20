using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
  public class CredentialSchema
  {
    public string Id { get; set; }

    public string Name { get; set; }

    public string Version { get; set; }

    public string AttributeNames { get; set; }

    public ArtifactType ArtifactType { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
