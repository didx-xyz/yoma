namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public List<ProgramPathwayStepInfo> Steps { get; set; }

    public int StepsTotal => Steps.Count;
  }
}
