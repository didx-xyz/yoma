using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayStepRequestBase
  {
    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    [JsonIgnore]
    public List<ProgramPathwayTaskRequestBase> TasksBase { get; set; } = null!;
  }

  public class ProgramPathwayStepRequestCreate : ProgramPathwayStepRequestBase
  {
    [Required]
    public List<ProgramPathwayTaskRequestCreate> Tasks
    {
      get => [.. TasksBase.Cast<ProgramPathwayTaskRequestCreate>()];
      set => TasksBase = [.. value.Cast<ProgramPathwayTaskRequestCreate>()];
    }

  }

  public class ProgramPathwayStepRequestUpdate : ProgramPathwayStepRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    [Required]
    public List<ProgramPathwayTaskRequestUpdate> Tasks
    {
      get => [.. TasksBase.Cast<ProgramPathwayTaskRequestUpdate>()];
      set => TasksBase = [.. value.Cast<ProgramPathwayTaskRequestUpdate>()];
    }
  }
}
