namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Represents a referral link created by a referrer for a specific referral program.
  /// The link acts as the parent entity for all referee engagements (claims).
  /// Whether multiple active links can exist per program for a given referrer
  /// is determined by the program configuration (MultipleLinksAllowed).
  /// The link's Id serves as the unique referral code embedded in both the full and shortened URLs.
  /// </summary>
  public class ReferralLink
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public Guid ProgramId { get; set; }

    public Guid UserId { get; set; }

    public Guid StatusId { get; set; }

    public ReferralLinkStatus Status { get; set; }

    public string URL { get; set; } = null!;

    public string ShortURL { get; set; } = null!;

    public int? CompletionTotal { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
