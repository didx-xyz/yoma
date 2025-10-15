namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayTaskInfo
  {
    public Guid Id { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public byte? Order { get; set; }
  }
}
