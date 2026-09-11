namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredentialIssuance
  {
    public Guid Id { get; set; }

    public Guid SchemaTypeId { get; set; }

    public SchemaType SchemaType { get; set; }

    /// <summary>
    /// Artifact type selected when issuance is scheduled. Schema resolution during processing must preserve it.
    /// </summary>
    public ArtifactType ArtifactType { get; set; }

    /// <summary>
    /// Full schema name committed when issuance is scheduled. Later Opportunity changes do not replace it.
    /// </summary>
    public string SchemaName { get; set; } = null!;

    /// <summary>
    /// Schema version used to issue the credential. Null until issuance succeeds.
    /// </summary>
    public string? SchemaVersion { get; set; }

    public Guid StatusId { get; set; }

    public CredentialIssuanceStatus Status { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrganizationId { get; set; }

    public Guid? MyOpportunityId { get; set; }

    public string? CredentialId { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
