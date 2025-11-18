namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayProgress
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

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

    /// <summary>
    /// Pathway-level progress:
    /// - If no steps exist → 100%
    /// - If rule = ANY → binary (any completed step = 100%, else 0)
    /// - If rule = ALL → partial progress allowed:
    ///     averages step.PercentComplete values rather than only counting completed steps
    ///     (this avoids getting stuck at 0% until a full step completes)
    /// </summary>
    public decimal PercentComplete
    {
      get
      {
        if (StepsTotal == 0)
          return 100m;

        if (Rule == PathwayCompletionRule.Any)
        {
          // Binary: any fully completed step = 100% for entire pathway
          return Steps.Any(s => s.PercentComplete >= 100m) ? 100m : 0m;
        }

        // ALL = proportional avg based on partial step completions
        // (e.g. step with 50% progress now contributes instead of being 0 until complete)
        var avg = Steps.Sum(s => s.PercentComplete) / StepsTotal;
        return Math.Round(Math.Clamp(avg, 0m, 100m), 2);
      }
    }

    public List<ProgramPathwayStepProgress> Steps { get; set; } = null!;

    public bool IsCompletable { get; set; }
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

    public bool IsCompletable { get; set; }
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

    public bool IsCompletable { get; set; }

    public string? NonCompletableReason { get; set; }
  }
}
