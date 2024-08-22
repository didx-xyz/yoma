namespace Yoma.Core.Domain.SSI.Models
{
  public class SSISchemaRequestCreate : SSISchemaRequestBase
  {
    public Guid TypeId { get; set; }

    public ArtifactType ArtifactType { get; set; }

  }
}
