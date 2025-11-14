namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ReferralProgressTriggerMessage
  {
    public ReferralTriggerSource Source { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? UserDisplayName { get; set; }

    public Guid? OpportunityId { get; set; }

    public string? OpportunityTitle { get; set; }
  }
}
