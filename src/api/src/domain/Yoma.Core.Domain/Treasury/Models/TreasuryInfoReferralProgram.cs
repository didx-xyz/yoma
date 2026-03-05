namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryInfoReferralProgram
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance { get; set; }
  }
}
