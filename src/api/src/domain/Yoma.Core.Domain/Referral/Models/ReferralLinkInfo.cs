namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; }

    public Guid UserId { get; set; }

    public string UserDisplayName { get; set; }

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; }

    public Guid StatusId { get; set; }

    public ReferralLinkStatus Status { get; set; }

    public string URL { get; set; }

    public string ShortURL { get; set; }

    public int? PendingTotal { get; set; }

    public int? CompletionTotal { get; set; }

    public int? ExpiredTotal { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }
  }
}
