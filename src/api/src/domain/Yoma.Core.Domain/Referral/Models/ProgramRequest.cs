using Newtonsoft.Json;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramRequestBase
  {
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public bool ProofOfPersonhoodRequired { get; set; }

    public bool PathwayRequired { get; set; }

    public bool MultipleLinksAllowed { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public List<Guid>? Countries { get; set; }

    public ProgramPathwayRequestUpsert? Pathway { get; set; }
  }

  public class ProgramRequestCreate : ProgramRequestBase { }

  public class ProgramRequestUpdate : ProgramRequestBase
  {
    public Guid Id { get; set; }
  }

  public class ProgramPathwayRequestUpsert
  {
    public Guid? Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public List<ProgramPathwayStepRequestUpsert> Steps { get; set; } = null!;
  }

  public class ProgramPathwayStepRequestUpsert
  {
    public Guid? Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public List<ProgramPathwayTaskRequestUpsert> Tasks { get; set; } = null!;

    [JsonIgnore]
    internal short OrderDisplay { get; set; }
  }

  public class ProgramPathwayTaskRequestUpsert
  {
    public Guid? Id { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Guid EntityId { get; set; }

    [JsonIgnore]
    internal short OrderDisplay { get; set; }
  }
}
