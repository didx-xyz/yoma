namespace Yoma.Core.Domain.SSI.Models.Lookups
{
  public class SSISchemaRequestCreate : SSISchemaRequestBase
  {
    public Guid TypeId { get; set; }

    public ArtifactType ArtifactType { get; set; }

  }
}
