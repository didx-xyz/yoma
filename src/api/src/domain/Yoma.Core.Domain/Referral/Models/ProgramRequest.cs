using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramRequestBase
  {
    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int? CompletionWindowInDays { get; set; }

    public int? CompletionLimitReferee { get; set; }

    public int? CompletionLimit { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    [Required]
    public bool ProofOfPersonhoodRequired { get; set; }

    [Required]
    public bool PathwayRequired { get; set; }

    [Required]
    public bool MultipleLinksAllowed { get; set; }

    [Required]
    public bool IsDefault { get; set; }

    [Required]
    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [JsonIgnore]
    public ProgramPathwayRequestUpsert? Pathway { get; set; }
  }

  public class ProgramRequestCreate : ProgramRequestBase { }

  public class ProgramRequestUpdate : ProgramRequestBase
  {
    [Required]
    public Guid Id { get; set; }
  }

  public abstract class ProgramPathwayRequestUpsert
  {
    public Guid? Id { get; set; }

    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [JsonIgnore]
    public List<ProgramPathwayStepRequestUpsert> Steps { get; set; } = null!;
  }

  public abstract class ProgramPathwayStepRequestUpsert
  {
    public Guid? Id { get; set; }

    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    [JsonIgnore]
    public List<ProgramPathwayTaskRequestUpsert> Tasks { get; set; } = null!;
  }

  public abstract class ProgramPathwayTaskRequestUpsert
  {
    public Guid? Id { get; set; }

    [Required]
    public PathwayTaskEntityType EntityType { get; set; }

    [Required]
    public Guid EntityId { get; set; }

    public byte? Order { get; set; }
  }
}
