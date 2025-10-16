using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
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
