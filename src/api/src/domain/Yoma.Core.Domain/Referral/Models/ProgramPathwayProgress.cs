namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public bool Completed => StepsTotal == 0 || StepsCompleted == StepsTotal;

    public DateTimeOffset? DateCompleted =>
    !Completed
      ? null
      : Rule == PathwayCompletionRule.Any
          ? Steps.Where(t => t.Completed && t.DateCompleted.HasValue).Min(t => t.DateCompleted)
          : Steps.Where(t => t.Completed && t.DateCompleted.HasValue).Max(t => t.DateCompleted);

    public int StepsTotal => Steps.Count;

    public int StepsCompleted => Steps.Count(s => s.Completed);

    public decimal PercentComplete => StepsTotal == 0
        ? 100m
        : Rule == PathwayCompletionRule.Any
            ? (Steps.Any(t => t.Completed) ? 100m : 0m)
            : Math.Round((decimal)Steps.Count(t => t.Completed) / StepsTotal * 100m, 2);

    public List<ProgramPathwayStepProgress> Steps { get; set; } = null!;
  }

  public class ProgramPathwayStepProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public bool Completed => TasksTotal == 0 || TasksCompleted == TasksTotal;

    public DateTimeOffset? DateCompleted =>
      !Completed
        ? null
        : Rule == PathwayCompletionRule.Any
            ? Tasks.Where(t => t.Completed && t.DateCompleted.HasValue).Min(t => t.DateCompleted)
            : Tasks.Where(t => t.Completed && t.DateCompleted.HasValue).Max(t => t.DateCompleted);

    public int TasksTotal => Tasks.Count;

    public int TasksCompleted => Tasks.Count(t => t.Completed);

    public decimal PercentComplete => TasksTotal == 0
        ? 100m
        : Rule == PathwayCompletionRule.Any
            ? (Tasks.Any(t => t.Completed) ? 100m : 0m)
            : Math.Round((decimal)Tasks.Count(t => t.Completed) / TasksTotal * 100m, 2);

    public List<ProgramPathwayTaskProgress> Tasks { get; set; } = null!;
  }

  public class ProgramPathwayTaskProgress
  {
    public Guid Id { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public bool Completed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }
  }
}
