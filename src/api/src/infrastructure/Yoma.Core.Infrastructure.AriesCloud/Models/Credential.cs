namespace Yoma.Core.Infrastructure.AriesCloud.Models
{
  public class Credential
  {
    public Guid Id { get; set; }

    public string ClientReferent { get; set; } = null!;

    public string SourceTenantId { get; set; } = null!;

    public string TargetTenantId { get; set; } = null!;

    public string SchemaId { get; set; } = null!;

    public string ArtifactType { get; set; } = null!;

    public string Attributes { get; set; } = null!;

    public string SignedValue { get; set; } = null!;

    public DateTimeOffset DateCreated { get; set; }
  }
}
