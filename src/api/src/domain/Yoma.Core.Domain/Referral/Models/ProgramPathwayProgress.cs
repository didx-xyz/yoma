namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public bool Completed => StepsTotal == 0 || StepsCompleted == StepsTotal;

    public DateTimeOffset? DateCompleted { get; set; }

    public int StepsTotal => Steps.Count;

    public int StepsCompleted => Steps.Count(s => s.Completed);

    public decimal PercentComplete => StepsTotal == 0 ? 100m : Math.Round(Steps.Sum(o => o.PercentComplete) / StepsTotal, 2);

    public List<ProgramPathwayStepProgress> Steps { get; set; } = null!;
  }

  public class ProgramPathwayStepProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    public bool Completed => TasksTotal == 0 || TasksCompleted == TasksTotal;

    public DateTimeOffset? DateCompleted { get; set; }

    public int TasksTotal => Tasks.Count;

    public int TasksCompleted => Tasks.Count(t => t.Completed);

    public decimal PercentComplete => TasksTotal == 0
        ? 100m
        : Rule == PathwayStepRule.Any
            ? (Tasks.Any(t => t.Completed) ? 100m : 0m)
            : Math.Round((decimal)Tasks.Count(t => t.Completed) / TasksTotal * 100m, 2);

    public List<ProgramPathwayTaskProgress> Tasks { get; set; } = null!;
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
