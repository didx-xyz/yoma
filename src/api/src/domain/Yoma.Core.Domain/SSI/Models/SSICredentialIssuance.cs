namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredentialIssuance
  {
    public Guid Id { get; set; }

    public Guid SchemaTypeId { get; set; }

    public SchemaType SchemaType { get; set; }

    public ArtifactType ArtifactType { get; set; }

    /// <summary>
    /// Full name of the schema selected when issuance was scheduled.
    /// </summary>
    public string SchemaName { get; set; } = null!;

    public string SchemaVersion { get; set; } = null!;

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
