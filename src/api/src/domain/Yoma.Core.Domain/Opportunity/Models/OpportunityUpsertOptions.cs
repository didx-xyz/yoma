using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityUpsertOptions
  {
    public bool EnsureOrganizationAuthorization { get; set; }

    public bool RaiseEvents { get; set; }

    public bool SendNotifications { get; set; }

    public SyncType? SyncTypeActionedBy { get; set; }

    public string? SyncExternalId { get; set; }
  }
}
