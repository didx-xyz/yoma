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

    public ProgramPathwayRequestBase? PathwayBase { get; set; }
  }

  public class ProgramRequestCreate : ProgramRequestBase
  {
    public ProgramPathwayRequestCreate? Pathway
    {
      get => PathwayBase as ProgramPathwayRequestCreate;
      set => PathwayBase = value;
    }
  }

  public class ProgramRequestUpdate : ProgramRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    public ProgramPathwayRequestUpdate? Pathway
    {
      get => PathwayBase as ProgramPathwayRequestUpdate;
      set => PathwayBase = value;
    }
  }

  public abstract class ProgramPathwayRequestBase
  {
    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [JsonIgnore]
    public List<ProgramPathwayStepRequestBase> StepsBase { get; set; } = null!;
  }

  public class ProgramPathwayRequestCreate : ProgramPathwayRequestBase
  {
    [Required]
    public List<ProgramPathwayStepRequestCreate> Steps
    {
      get => [.. StepsBase.Cast<ProgramPathwayStepRequestCreate>()];
      set => StepsBase = [.. value.Cast<ProgramPathwayStepRequestBase>()];
    }
  }

  public class ProgramPathwayRequestUpdate : ProgramPathwayRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    [Required]
    public List<ProgramPathwayStepRequestUpdate> Steps
    {
      get => [.. StepsBase.Cast<ProgramPathwayStepRequestUpdate>()];
      set => StepsBase = [.. value.Cast<ProgramPathwayStepRequestBase>()];
    }
  }
}
