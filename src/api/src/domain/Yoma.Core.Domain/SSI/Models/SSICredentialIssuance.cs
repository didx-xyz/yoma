namespace Yoma.Core.Domain.SSI.Models
{
  /// <summary>
  /// Durable credential schedule. The same-provider Replay contract and migration/job
  /// ordering are documented on <see cref="Services.SSIBackgroundService"/>.
  /// </summary>
  public class SSICredentialIssuance
  {
    /// <summary>
    /// Also used as the provider client referent for issuance recovery; retain it when scheduling Replay.
    /// </summary>
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

    /// <summary>
    /// Existing artifact identity, scoped to its holder tenant. Replay cleanup must retain
    /// this value until deletion or absence is confirmed, then clear it before reissuance.
    /// </summary>
    public string? CredentialId { get; set; }

    /// <summary>
    /// Signed Yoma issue date, retained across Replay and provider cutover. Null until the actual
    /// credential date is known. The capability migration backfills legacy Issued rows from
    /// DateModified once; runtime processing does not infer it from scheduling/audit timestamps.
    /// </summary>
    public DateTimeOffset? DateIssued { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
