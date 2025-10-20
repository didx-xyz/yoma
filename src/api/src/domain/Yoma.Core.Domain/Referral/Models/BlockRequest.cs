namespace Yoma.Core.Domain.Referral.Models
{
  public class BlockRequest
  {
    public Guid UserId { get; set; }

    public Guid ReasonId { get; set; }

    public string? Comment { get; set; }

    /// <summary>
    /// Indicates whether all active referral links for the blocked referrer should be cancelled immediately.
    /// </summary>
    public bool? CancelLinks { get; set; }
  }
}
