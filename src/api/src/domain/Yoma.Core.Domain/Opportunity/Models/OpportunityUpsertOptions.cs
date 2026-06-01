using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public sealed class OpportunityUpsertOptions
  {
    public bool EnsureOrganizationAuthorization { get; set; }

    public bool RaiseEvents { get; set; } = true;

    public bool SendNotifications { get; set; } = true;

    public SyncType? SyncTypeActionedBy { get; set; }

    public string? SyncExternalId { get; set; }
  }
}
