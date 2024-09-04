namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityAllocateRewardResponse
  {
    public decimal? ZltoReward { get; set; }

    public bool? ZltoRewardReduced { get; set; }

    public bool? ZltoRewardPoolDepleted { get; set; }

    public decimal? YomaReward { get; set; }

    public bool? YomaRewardReduced { get; set; }

    public bool? YomaRewardPoolDepleted { get; set; }
  }
}
