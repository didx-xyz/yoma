namespace Yoma.Core.Domain.SSI.Models
{
  /// <summary>
  /// Durable tenant schedule. Same-provider credential Replay preserves Created state, TenantId
  /// and connections; only a separately planned provider-switch migration resets tenant state.
  /// See <see cref="Services.SSIBackgroundService"/> for the Replay contract.
  /// </summary>
  public class SSITenantCreation
  {
    public Guid Id { get; set; }

    public string EntityType { get; set; } = null!;

    public Guid StatusId { get; set; }

    public TenantCreationStatus Status { get; set; }

    public Guid? UserId { get; set; }

    public Guid? OrganizationId { get; set; }

    public string? TenantId { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
