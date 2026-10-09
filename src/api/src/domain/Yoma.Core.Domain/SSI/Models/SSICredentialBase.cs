namespace Yoma.Core.Domain.SSI.Models
{
  public abstract class SSICredentialBase
  {
    public string Id { get; set; } = null!;

    public ArtifactType ArtifactType { get; set; }

    public SchemaType SchemaType { get; set; }

    /// <summary>
    /// Credential context for wallet card presentation, normalized from a mapped signed system attribute.
    /// Null when no supported context is present, including YoID. Never inferred from schema context
    /// or the current editable source entity; the schema type identifies the credential family.
    /// </summary>
    public string? TypeContext { get; set; }

    public string Issuer { get; set; } = null!;

    public string? IssuerLogoURL { get; set; }

    public string Title { get; set; } = null!;

    public DateTimeOffset? DateIssued { get; set; }

    public virtual List<SSICredentialAttribute> Attributes { get; set; } = null!;
  }
}
