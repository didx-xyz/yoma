namespace Yoma.Core.Domain.Referral.Models
{
  public class UnblockRequest
  {
    public Guid UserId { get; set; }

    public string? Comment { get; set; }
  }
}
