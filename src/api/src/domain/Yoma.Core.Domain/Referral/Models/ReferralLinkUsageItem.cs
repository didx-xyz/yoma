namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageItem
  {
    public Guid Id { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; } = null!;

    public DateTimeOffset DateClaimed { get; set; }
  }
}
