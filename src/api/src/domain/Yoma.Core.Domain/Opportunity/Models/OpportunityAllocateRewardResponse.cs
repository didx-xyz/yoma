namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityAllocateRewardResponse
  {
    public Opportunity Opportunity { get; set; } = null!;

    public decimal? ZltoReward { get; set; }

    public bool? ZltoRewardReduced { get; set; }

    public bool? ZltoRewardPoolDepleted { get; set; }

  }
}
