namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public bool Completed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public int StepsTotal { get; set; }

    public int StepsCompleted { get; set; }

    public decimal PercentComplete { get; set; }

    public List<ProgramPathwayStepProgress> Steps { get; set; }
  }

  public class ProgramPathwayStepProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    public bool Completed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public int TasksTotal { get; set; }

    public int TasksCompleted { get; set; }

    public decimal PercentComplete { get; set; }

    public List<ProgramPathwayTaskProgress> Tasks { get; set; }
  }

  public class ProgramPathwayTaskProgress
  {
    public Guid Id { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public byte? Order { get; set; }

    public bool Completed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }
}
