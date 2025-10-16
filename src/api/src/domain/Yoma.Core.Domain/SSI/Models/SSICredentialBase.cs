namespace Yoma.Core.Domain.SSI.Models
{
  public abstract class SSICredentialBase
  {
    public string Id { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public SchemaType SchemaType { get; set; }

    public string Issuer { get; set; } = null!;

    public string IssuerLogoURL { get; set; } = null!;

    public string Title { get; set; } = null!;

    public DateTimeOffset? DateIssued { get; set; }

    public virtual List<SSICredentialAttribute> Attributes { get; set; } = null!;
  }
}
